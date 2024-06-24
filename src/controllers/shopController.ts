import { Request, Response, NextFunction } from "express-serve-static-core";
import ProductModel, { ProductAttribute } from "../models/product";
import { Ok } from "../response/ok/okResponse";

import cartModel from "../models/cartsModel";
import sequelize from "../utils/sequelize";
import { ErrorResponse } from "../response/error/ErrorResponse";
import CartItems, { CartsItemsType, combinedType } from "../models/cartsItems";
import { client } from "../utils/paypalClient";

import paypal from "paypal-rest-sdk";
import Order from "../models/order";
import User from "../models/userModel";
import Address from "../models/addressModel";
import { Sequelize, UniqueConstraintError } from "sequelize";
import OrderItem, { OrderItemAttribute } from "../models/orderItems";
import { validationResult } from "express-validator";

export default class ShopController {
  constructor() {}

  static async getShop(
    req: Request,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    try {
      const allProduct = await ProductModel.findAll({
        attributes: ["id", "productImageUri", "productName", "productPrice"],
        raw: true,
      });
      if (allProduct.length <= 0) {
        // const err = new ErrorResponse("no product found", "200", 200, {});
        // return res.status(200).json(err);
        return res.status(200).json({
          message: "no product found",
          status: "success",
          statusCode: 200,
          data: [],
        });
      }
      res.status(200).json({
        message: "successful",
        status: "success",
        statusCode: 200,
        data: { ...allProduct },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductDetails(
    req: Request<{ productId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const foundProduct = await ProductModel.findOne({
        where: { id: req.params.productId },
        raw: true,
      });
      if (!foundProduct) {
        res.status(404).json({
          message: "product not found",
          status: "error",
          statusCode: 404,
          data: {},
        });
      }
      res.status(200).json({
        message: "successful",
        status: "success",
        statusCode: 200,
        data: { ...foundProduct },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addProductToCart(
    req: Request<{ productId: string }, {}, {}, { qty: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const [cartM] = await cartModel.findOrCreate({
        where: { userId: req.userId },
      });

      const product = await ProductModel.findByPk(req.params.productId);

      if (!product) {
        const err = new ErrorResponse("", "404", 404, "product not found");
        return res.status(404).json(err);
      }

      const foundProductInCart = await CartItems.findOne({
        where: { productId: product.id },
      });

      let cartItems;
      if (!foundProductInCart) {
        cartItems = await cartM.createCartItem({
          productName: product.productName,
          productId: product.id,
          quantity: +req.query.qty,
          // price: product.productPrice,
        });
      } else {
        foundProductInCart.quantity += +req.query.qty;
        cartItems = await foundProductInCart.save();
      }

      transaction.commit();

      res.status(201).json({
        message: "update successful",
        status: "updated",
        statusCode: 201,
        data: { ...cartItems.toJSON() },
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  static async reduceProductQuantyInCart(
    req: Request<{ cartId: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const cartItem = await CartItems.findOne({
        where: { id: req.params.cartId },
      });

      if (!cartItem) {
        const err = new ErrorResponse("Cart item not found", "401", 404, {});
        return res.status(404).json(err);
      }

      const { qty } = req.query;
      let val: number;
      if (!qty) {
        val = 1;
      } else {
        val = +qty;
      }

      cartItem.quantity += -val;

      if (cartItem.quantity >= 1) {
        await cartItem.save();

        transaction.commit();
        return res.status(201).json({
          message: "Product quantity decreased by 1",
          status: "updated",
          statusCode: 201,
          data: cartItem,
        });
      } else {
        await cartItem.destroy();
        transaction.commit();
        return res.status(201).json({
          message: "Product removed from cart",
          status: "deleted",
          statusCode: 201,
          data: {},
        });
      }
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  static async increaseProductQuantyInCart(
    req: Request<{ cartId: string }, {}, {}, { qty: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const cartItem = await CartItems.findOne({
        where: { id: req.params.cartId },
      });

      if (!cartItem) {
        const err = new ErrorResponse("Cart item not found", "401", 404, {});
        return res.status(404).json(err);
      }

      const { qty } = req.query;
      let val: number;
      if (!qty) {
        val = 1;
      } else {
        val = +qty;
      }

      cartItem.quantity += val;
      await cartItem.save();

      transaction.commit();
      return res.status(201).json({
        message: "Product quantity increase",
        status: "updated",
        statusCode: 201,
        data: cartItem,
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  static async removeProductFromCart(
    req: Request<{ cartId: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();

    try {
      const cartItem = await CartItems.findOne({
        where: { id: req.params.cartId },
      });

      if (!cartItem) {
        const err = new ErrorResponse("Cart item not found", "404", 404, {});
        return res.status(404).json(err);
      }

      await cartItem.destroy();
      transaction.commit();
      return res.status(201).json({
        message: "Product removed from cart",
        status: "deleted",
        statusCode: 201,
        data: {},
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  static async getAllCartItems(
    req: Request,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    try {
      const [cartmodel] = await cartModel.findOrCreate({
        where: { userId: req.userId },
      });

      const cartItems = await CartItems.findAll({
        where: { cartId: cartmodel.id },
        include: [
          {
            model: ProductModel,
            as: "product",
          },
        ],
      });

      if (cartItems.length < 1) {
        // const err = new ErrorResponse(, "404", 404, {});
        return res.status(404).json({
          message: "no item in cart...",
          status: "404",
          statusCode: 404,
          data: {},
        });
      }

      type val = {
        id: number;
        productName: string;
        productId: number;
        quantity: number;
        cartId: number;
        createdAt: Date;
        updatedAt: Date;
        product: { productPrice: number };
      };

      const totalPrice: number = cartItems
        .map((item) => item.toJSON() as val)
        .reduce((acc: number, cur: val) => {
          return acc + cur.product.productPrice * cur.quantity;
        }, 0);

      if (cartItems.length === 0) {
        // const err = new ErrorResponse("no item in cart...", "404", 404, {});
        // return res.status(404).json(err);
        res.status(200).json({
          message: "no item in cart...",
          status: "success",
          statusCode: 200,
          data: cartItems,
        });
      }

      res.status(200).json({
        message: "all cart items fetched",
        status: "success",
        statusCode: 200,
        data: { cartItems, totalPrice },
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(
    req: Request,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    try {
      const { userId } = req;
      const address: Address[] = await Address.findAll({ where: { userId } });
      if (address.length < 1) {
        console.log("length is zero");
        const url = `${req.protocol}://${req.headers.host}/add-address`;
        return res.status(301).json({
          message: "redirect msg",
          status: "redirect",
          statusCode: 301,
          data: { url, method: "POST" },
        });
      }

      res.status(200).json({
        message: "user address found",
        status: "success",
        statusCode: 200,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addAddress(
    req: Request<
      {},
      {},
      {
        city: string;
        country: string;
        state: string;
        street: string;
        zip: string;
        houseNumber: string;
      },
      {}
    >,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const error = validationResult(req);

    const err = new ErrorResponse(
      "invalid data input",
      "error",
      422,
      error.array()
    );

    if (!error.isEmpty()) return res.status(422).json(err);
    const transaction = await sequelize.transaction();
    try {
      const { userId } = req;
      const { city, country, state, street, zip, houseNumber } = req.body;

      const curretAddress = await Address.update(
        { deliveredTo: false },
        { where: { userId, deliveredTo: true }, transaction }
      );

      const address = await Address.create(
        {
          city,
          country,
          state,
          street,
          userId: +userId,
          zip,
          houseNumber,
        },
        { transaction }
      );
      transaction.commit();
      res.status(201).json({
        message: "address creation successful",
        status: "created",
        statusCode: 201,
        data: address,
      });
    } catch (error) {
      transaction.rollback();
      if (error instanceof UniqueConstraintError) {
        next(error);
      } else {
        next(error);
      }
    }
  }

  // static async addCartItemsToOrder(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const userCart = await cartModel.findOne({
  //       where: { userId: req.userId },
  //       include: [
  //         {
  //           model: CartItems,
  //           as: "cartItems",
  //           include: [
  //             {
  //               model: ProductModel,
  //               as: "product",
  //             },
  //           ],
  //         },
  //       ],
  //     });

  //     if (!userCart) {
  //       console.log("User cart not found");
  //       const err = new ErrorResponse("no item in cart...", "404", 404, {});
  //       return res.status(404).json(err);
  //     }

  //     type val = {
  //       id: number;
  //       productName: string;
  //       productId: number;
  //       quantity: number;
  //       cartId: number;
  //       createdAt: Date;
  //       updatedAt: Date;
  //       product: { productPrice: number };
  //     };

  //     const [id, userId, cartItems] = Object.values(userCart.toJSON());
  //     console.log(cartItems.cartId);

  //     const totalValue: number = cartItems.reduce(
  //       (acc: number, cur: val, _indx: number, _arr: []) => {
  //         acc += +(cur.product.productPrice * cur.quantity);
  //         return acc;
  //       },
  //       0
  //     );

  //     const createOrder = async () => {
  //       const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  //       request.requestBody({
  //         intent: "CAPTURE",
  //         purchase_units: [
  //           {
  //             amount: {
  //               currency_code: "NGN", // Set the currency to NGN
  //               value: totalValue.toFixed(2),
  //             },
  //             description: "payment for booking a session with the doctor",
  //             items: cartItems.map((item: val) => ({
  //               name: item.productName,
  //               sku: item.productId.toString(),
  //               unit_amount: {
  //                 currency_code: "NGN", // Set the currency to NGN
  //                 value: item.product.productPrice.toFixed(2),
  //               },
  //               quantity: item.quantity.toString(),
  //             })),
  //           },
  //         ],
  //         application_context: {
  //           return_url: `http://localhost:3000/order/success/${id}?total=${totalValue}`,
  //           cancel_url: "http://localhost:3000/order/cancel",
  //         },
  //       });

  //       return await client().execute(request);
  //     };

  //     const order = await createOrder();
  //     res
  //       .status(200)
  //       .json({
  //         redirect: order.result.links.find((link) => link.rel === "approve")
  //           .href,
  //       });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async addCartItemsToOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      paypal.configure({
        mode: "sandbox", //sandbox or live
        client_id: process.env.PAYPAL_CLIENT_ID as string,
        client_secret: process.env.PAYPAL_SECRET as string,
      });

      const userCart = await cartModel.findOne({
        where: { userId: req.userId },
        include: [
          {
            model: CartItems,
            as: "cartItems",
            include: [
              {
                model: ProductModel,
                as: "product",
              },
            ],
          },
        ],
      });

      if (!userCart) {
        console.log("User cart not found");
        const err = new ErrorResponse("no item in cart...", "404", 404, {});
        return res.status(404).json(err);
      }

      type val = {
        id: number;
        productName: string;
        productId: number;
        quantity: number;
        cartId: number;
        createdAt: Date;
        updatedAt: Date;
        product: { productPrice: number };
      };

      const [id, userId, cAt, uAt, cartItems] = Object.values(
        userCart.toJSON()
      );

      const totalValue: number = cartItems.reduce(
        (acc: number, cur: val, _indx: number, _arr: []) => {
          acc += +(cur.product.productPrice * cur.quantity);
          return acc;
        },
        0
      );

      const mapedArr: Array<{}> = cartItems.map((item: val) => {
        return { cartId: item.id, productId: item.productId };
      });

      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${req.protocol}://${req.headers.host}/order/success/${id}?total=${totalValue}`,
          cancel_url: `${req.protocol}://${req.headers.host}/order/cancel`,
        },
        transactions: [
          {
            item_list: {
              items: cartItems.map((item: val) => {
                return {
                  name: item.productName.toString(),
                  sku: item.productId.toString(),
                  price: item.product.productPrice.toFixed(2),
                  currency: "USD",
                  quantity: item.quantity,
                };
              }),
            },
            amount: {
              currency: "USD",
              total: totalValue.toFixed(2),
            },
            description: "payment for service render or product",
          },
        ],
      };

      paypal.payment.create(
        create_payment_json,
        function (error, payment: paypal.PaymentResponse) {
          if (error) {
            next(error);
          } else {
            console.log("Create Payment Response");
            const linkObj = payment.links?.find(
              (linksObj) => linksObj.rel === "approval_url"
            ) as paypal.Link;

            res.status(200).json({ redirect: linkObj.href });
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }

  static async postSuccess(
    req: Request<
      { cartId: string },
      {},
      {},
      {
        total: string;
        paymentId: string;
        token: string;
        PayerID: string;
        cartInfo: {}[];
      }
    >,
    res: Response<Ok>,
    next: NextFunction
  ) {
    const { userId } = req;
    const { total, paymentId, token, PayerID, cartInfo } = req.query;
    const { cartId } = req.params;
    console.log("get success", userId);
    const transaction = await sequelize.transaction();

    try {
      const execute_payment_json = {
        payer_id: PayerID,
        transactions: [
          {
            amount: {
              currency: "USD",
              total: Number(total).toFixed(2),
            },
          },
        ],
      };

      const payment = await new Promise((resolve, reject) => {
        paypal.payment.execute(
          paymentId,
          execute_payment_json,
          (error, payment) => {
            if (error) {
              reject(error);
            } else {
              resolve(payment);
            }
          }
        );
      });

      const userCart: any = await CartItems.findAll({
        where: { cartId },
        include: [{ model: ProductModel, as: "product" }],
        raw: true,
      });

      console.log("total cart", userCart);
      // console.log(userCart);

      const foundUser = await User.findOne({ where: { id: userId } });

      if (!foundUser) {
        return next("user not found...");
      }

      const deliveredAddress: Address[] = await foundUser.getAddresses({
        where: {
          deliveredTo: true,
        },
        raw: true,
      });

      const createdOrder = await foundUser.createOrder(
        {
          totalAmount: +total,
          deliveryAddress: deliveredAddress[0].id,
        },
        { transaction }
      );
      console.log("createdOrder", createdOrder);

      const cartArr = userCart.map((currentObj: combinedType) => {
        return {
          productId: currentObj.productId,
          quantity: currentObj.quantity,
          unitPrice: currentObj["product.productPrice"],
          orderId: createdOrder.id,
          priceOfQuantity: 0,
        };
      });
      console.log(cartArr);

      const createdOrderItems = await OrderItem.bulkCreate(cartArr, {
        transaction,
      });
      console.log(createdOrderItems, "create");
      for (const currentObj of userCart) {
        await ProductModel.update(
          {
            numbersOfProductAvailable: sequelize.literal(
              `"numbersOfProductAvailable" - ${currentObj.quantity}`
            ),
          },
          {
            where: { id: currentObj.productId },
            transaction,
          }
        );
      }

      console.log("after for each");

      await CartItems.destroy({ where: { cartId }, transaction });

      console.log("after destroy");

      await transaction.commit();
      res.status(201).json({
        message: "successful",
        status: "created",
        statusCode: 201,
        data: createdOrderItems,
      });
    } catch (err) {
      await transaction.rollback();
      next(err);
    }
  }

  static getCancel(_req: Request, res: Response, _next: NextFunction) {
    res.status(400).json({ message: "cancelled" });
  }
}
