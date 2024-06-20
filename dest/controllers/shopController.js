"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_1 = __importDefault(require("../models/product"));
const cartsModel_1 = __importDefault(require("../models/cartsModel"));
const sequelize_1 = __importDefault(require("../utils/sequelize"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
const cartsItems_1 = __importDefault(require("../models/cartsItems"));
const paypal_rest_sdk_1 = __importDefault(require("paypal-rest-sdk"));
const userModel_1 = __importDefault(require("../models/userModel"));
const addressModel_1 = __importDefault(require("../models/addressModel"));
const sequelize_2 = require("sequelize");
const orderItems_1 = __importDefault(require("../models/orderItems"));
const express_validator_1 = require("express-validator");
class ShopController {
    constructor() { }
    static getShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allProduct = yield product_1.default.findAll({
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
                    data: Object.assign({}, allProduct),
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getProductDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allProduct = yield product_1.default.findOne({
                    where: { id: req.params.productId },
                    raw: true,
                });
                res.status(200).json({
                    message: "successful",
                    status: "success",
                    statusCode: 200,
                    data: Object.assign({}, allProduct),
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static addProductToCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const [cartM] = yield cartsModel_1.default.findOrCreate({
                    where: { userId: req.userId },
                });
                const product = yield product_1.default.findByPk(req.params.productId);
                if (!product) {
                    const err = new ErrorResponse_1.ErrorResponse("kindly put product image", "401", 404, {});
                    return res.status(404).json(err);
                }
                const foundProductInCart = yield cartsItems_1.default.findOne({
                    where: { productId: product.id },
                });
                let cartItems;
                if (!foundProductInCart) {
                    cartItems = yield cartM.createCartItem({
                        productName: product.productName,
                        productId: product.id,
                        quantity: +req.query.qty,
                        // price: product.productPrice,
                    });
                }
                else {
                    foundProductInCart.quantity += +req.query.qty;
                    cartItems = yield foundProductInCart.save();
                }
                transaction.commit();
                res.status(201).json({
                    message: "update successful",
                    status: "updated",
                    statusCode: 201,
                    data: Object.assign({}, cartItems.toJSON()),
                });
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
    static reduceProductQuantyInCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const cartItem = yield cartsItems_1.default.findOne({
                    where: { id: req.params.cartId },
                });
                if (!cartItem) {
                    const err = new ErrorResponse_1.ErrorResponse("Cart item not found", "401", 404, {});
                    return res.status(404).json(err);
                }
                if (cartItem.quantity > 1) {
                    cartItem.quantity -= 1;
                    yield cartItem.save();
                    transaction.commit();
                    return res.status(201).json({
                        message: "Product quantity decreased by 1",
                        status: "updated",
                        statusCode: 201,
                        data: cartItem,
                    });
                }
                else {
                    yield cartItem.destroy();
                    transaction.commit();
                    return res.status(201).json({
                        message: "Product removed from cart",
                        status: "deleted",
                        statusCode: 201,
                        data: {},
                    });
                }
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
    static increaseProductQuantyInCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const cartItem = yield cartsItems_1.default.findOne({
                    where: { id: req.params.cartId },
                });
                if (!cartItem) {
                    const err = new ErrorResponse_1.ErrorResponse("Cart item not found", "401", 404, {});
                    return res.status(404).json(err);
                }
                cartItem.quantity += 1;
                yield cartItem.save();
                transaction.commit();
                return res.status(201).json({
                    message: "Product quantity decreased by 1",
                    status: "updated",
                    statusCode: 201,
                    data: cartItem,
                });
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
    static removeProductFromCart(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const cartItem = yield cartsItems_1.default.findOne({
                    where: { id: req.params.cartId },
                });
                if (!cartItem) {
                    const err = new ErrorResponse_1.ErrorResponse("Cart item not found", "401", 404, {});
                    return res.status(404).json(err);
                }
                yield cartItem.destroy();
                transaction.commit();
                return res.status(201).json({
                    message: "Product removed from cart",
                    status: "deleted",
                    statusCode: 201,
                    data: {},
                });
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
    static getAllCartItems(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [cartmodel] = yield cartsModel_1.default.findOrCreate({
                    where: { userId: req.userId },
                });
                const cartItems = yield cartsItems_1.default.findAll({
                    where: { cartId: cartmodel.id },
                    include: [
                        {
                            model: product_1.default,
                            as: "product",
                        },
                    ],
                });
                if (cartItems.length < 1) {
                    console.log("User cart not found");
                    const err = new ErrorResponse_1.ErrorResponse("no item in cart...", "404", 404, {});
                    return res.status(404).json(err);
                }
                const totalPrice = cartItems
                    .map((item) => item.toJSON())
                    .reduce((acc, cur) => {
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
            }
            catch (error) {
                next(error);
            }
        });
    }
    static checkOut(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req;
                const address = yield addressModel_1.default.findAll({ where: { userId } });
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
            }
            catch (error) {
                next(error);
            }
        });
    }
    static addAddress(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const error = (0, express_validator_1.validationResult)(req);
            const err = new ErrorResponse_1.ErrorResponse("invalid data input", "error", 422, error.array());
            if (!error.isEmpty())
                return res.status(422).json(err);
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { userId } = req;
                const { city, country, state, street, zip, houseNumber } = req.body;
                const curretAddress = yield addressModel_1.default.update({ deliveredTo: false }, { where: { userId, deliveredTo: true }, transaction });
                const address = yield addressModel_1.default.create({
                    city,
                    country,
                    state,
                    street,
                    userId: +userId,
                    zip,
                    houseNumber,
                }, { transaction });
                transaction.commit();
                res.status(201).json({
                    message: "address creation successful",
                    status: "created",
                    statusCode: 201,
                    data: address,
                });
            }
            catch (error) {
                transaction.rollback();
                if (error instanceof sequelize_2.UniqueConstraintError) {
                    next(error);
                }
                else {
                    next(error);
                }
            }
        });
    }
    static addCartItemsToOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                paypal_rest_sdk_1.default.configure({
                    mode: "sandbox", //sandbox or live
                    client_id: process.env.PAYPAL_CLIENT_ID,
                    client_secret: process.env.PAYPAL_SECRET,
                });
                console.log(req.userId);
                const userCart = yield cartsModel_1.default.findOne({
                    where: { userId: req.userId },
                    include: [
                        {
                            model: cartsItems_1.default,
                            as: "cartItems",
                            include: [
                                {
                                    model: product_1.default,
                                    as: "product",
                                },
                            ],
                        },
                    ],
                });
                if (!userCart) {
                    console.log("User cart not found");
                    const err = new ErrorResponse_1.ErrorResponse("no item in cart...", "404", 404, {});
                    return res.status(404).json(err);
                }
                const [id, userId, cartItems] = Object.values(userCart.toJSON());
                console.log(cartItems.cartId);
                const totalValue = cartItems.reduce((acc, cur, _indx, _arr) => {
                    acc += +(cur.product.productPrice * cur.quantity);
                    return acc;
                }, 0);
                const mapedArr = cartItems.map((item) => {
                    return { cartId: item.id, productId: item.productId };
                });
                console.log(mapedArr, totalValue);
                const create_payment_json = {
                    intent: "sale",
                    payer: {
                        payment_method: "paypal",
                    },
                    redirect_urls: {
                        return_url: `http://localhost:3000/order/success/${id}?total=${totalValue}`,
                        cancel_url: "http://localhost:3000/order/cancel",
                    },
                    transactions: [
                        {
                            item_list: {
                                items: cartItems.map((item) => {
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
                            description: "payment for booking a session with the doctor",
                        },
                    ],
                };
                paypal_rest_sdk_1.default.payment.create(create_payment_json, function (error, payment) {
                    var _a, _b;
                    if (error) {
                        console.log((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.details);
                        next(error);
                    }
                    else {
                        console.log("Create Payment Response");
                        const linkObj = (_b = payment.links) === null || _b === void 0 ? void 0 : _b.find((linksObj) => linksObj.rel === "approval_url");
                        console.log(linkObj);
                        // res.redirect(linkObj.href);
                        res.status(200).json({ redirect: linkObj.href });
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static postSuccess(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = req;
            const { total, paymentId, token, PayerID, cartInfo } = req.query;
            const { cartId } = req.params;
            console.log("get success", userId);
            const transaction = yield sequelize_1.default.transaction();
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
                const payment = yield new Promise((resolve, reject) => {
                    paypal_rest_sdk_1.default.payment.execute(paymentId, execute_payment_json, (error, payment) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(payment);
                        }
                    });
                });
                const userCart = yield cartsItems_1.default.findAll({
                    where: { cartId },
                    include: [{ model: product_1.default, as: "product" }],
                    raw: true,
                });
                console.log("total cart", userCart);
                // console.log(userCart);
                const foundUser = yield userModel_1.default.findOne({ where: { id: userId } });
                if (!foundUser) {
                    return next("user not found...");
                }
                const deliveredAddress = yield foundUser.getAddresses({
                    where: {
                        deliveredTo: true,
                    },
                    raw: true,
                });
                const createdOrder = yield foundUser.createOrder({
                    totalAmount: +total,
                    deliveryAddress: deliveredAddress[0].id,
                }, { transaction });
                console.log("createdOrder", createdOrder);
                const cartArr = userCart.map((currentObj) => {
                    return {
                        productId: currentObj.productId,
                        quantity: currentObj.quantity,
                        unitPrice: currentObj["product.productPrice"],
                        orderId: createdOrder.id,
                        priceOfQuantity: 0,
                    };
                });
                console.log(cartArr);
                const createdOrderItems = yield orderItems_1.default.bulkCreate(cartArr, {
                    transaction,
                });
                userCart.forEach((currentObj) => __awaiter(this, void 0, void 0, function* () {
                    yield product_1.default.update({
                        numbersOfProductAvailable: sequelize_1.default.literal(`numbersOfProductAvailable - ${currentObj.quantity}`),
                    }, { where: { id: currentObj.productId }, transaction });
                }));
                yield cartsItems_1.default.destroy({ where: { cartId }, transaction });
                console.log(JSON.stringify(payment));
                yield transaction.commit();
                res.status(201).json({
                    message: "successful",
                    status: "created",
                    statusCode: 201,
                    data: createdOrderItems,
                });
            }
            catch (err) {
                yield transaction.rollback();
                next(err);
            }
        });
    }
    static getCancel(_req, res, _next) {
        res.status(400).json({ message: "cancelled" });
    }
}
exports.default = ShopController;
