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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const paypal_rest_sdk_1 = __importDefault(require("paypal-rest-sdk"));
const userModel_1 = __importDefault(require("../models/userModel"));
const addressModel_1 = __importDefault(require("../models/addressModel"));
const sequelize_2 = require("sequelize");
const orderItems_1 = __importDefault(require("../models/orderItems"));
const express_validator_1 = require("express-validator");
const s3clientHelper_1 = __importDefault(require("../utils/s3clientHelper"));
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
                    return res.status(200).json({
                        message: "no product found",
                        status: "success",
                        statusCode: 200,
                        data: [],
                    });
                }
                for (const item of allProduct) {
                    const img = new client_s3_1.GetObjectCommand({
                        Key: item.productImageUri,
                        Bucket: process.env.BUCKET_NAME,
                    });
                    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3clientHelper_1.default, img, {
                        expiresIn: 3600,
                    });
                    console.log(item.productImageUri);
                    item.productImageUri = url;
                }
                res.status(200).json({
                    message: "successful",
                    status: "success",
                    statusCode: 200,
                    data: allProduct,
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
                const foundProduct = yield product_1.default.findOne({
                    where: { id: req.params.productId },
                    raw: true,
                });
                if (!foundProduct) {
                    return res.status(404).json({
                        message: "product not found",
                        status: "error",
                        statusCode: 404,
                        data: {},
                    });
                }
                const img = new client_s3_1.GetObjectCommand({
                    Key: foundProduct.productImageUri,
                    Bucket: process.env.BUCKET_NAME,
                });
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3clientHelper_1.default, img, {
                    expiresIn: 3600,
                });
                foundProduct.productImageUri = url;
                res.status(200).json({
                    message: "successful",
                    status: "success",
                    statusCode: 200,
                    data: Object.assign({}, foundProduct),
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
                    const err = new ErrorResponse_1.ErrorResponse("", "404", 404, "product not found");
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
                const { qty } = req.query;
                let val;
                if (!qty) {
                    val = 1;
                }
                else {
                    val = +qty;
                }
                cartItem.quantity += -val;
                if (cartItem.quantity >= 1) {
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
                const { qty } = req.query;
                let val;
                if (!qty) {
                    val = 1;
                }
                else {
                    val = +qty;
                }
                cartItem.quantity += val;
                yield cartItem.save();
                transaction.commit();
                return res.status(201).json({
                    message: "Product quantity increase",
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
                    const err = new ErrorResponse_1.ErrorResponse("Cart item not found", "404", 404, {});
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
                    return res.status(404).json({
                        message: "no item in cart...",
                        status: "404",
                        statusCode: 404,
                        data: {},
                    });
                }
                const totalPrice = cartItems
                    .map((item) => item.toJSON())
                    .reduce((acc, cur) => {
                    return acc + cur.product.productPrice * cur.quantity;
                }, 0);
                if (cartItems.length === 0) {
                    return res.status(200).json({
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
                    const url = `${ShopController.BASE_URL}/add-address`;
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
                    const err = new ErrorResponse_1.ErrorResponse("no item in cart...", "404", 404, {});
                    return res.status(404).json(err);
                }
                const [id, userId, cAt, uAt, cartItems] = Object.values(userCart.toJSON());
                const totalValue = cartItems.reduce((acc, cur, _indx, _arr) => {
                    acc += +(cur.product.productPrice * cur.quantity);
                    return acc;
                }, 0);
                const mapedArr = cartItems.map((item) => {
                    return { cartId: item.id, productId: item.productId };
                });
                const create_payment_json = {
                    intent: "sale",
                    payer: {
                        payment_method: "paypal",
                    },
                    redirect_urls: {
                        return_url: `${ShopController}/order/success/${id}?total=${totalValue}`,
                        cancel_url: `${ShopController}/order/cancel`,
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
                            description: "payment for service render or product",
                        },
                    ],
                };
                paypal_rest_sdk_1.default.payment.create(create_payment_json, function (error, payment) {
                    var _a;
                    if (error) {
                        next(error);
                    }
                    else {
                        console.log("Create Payment Response");
                        const linkObj = (_a = payment.links) === null || _a === void 0 ? void 0 : _a.find((linksObj) => linksObj.rel === "approval_url");
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
                console.log(createdOrderItems, "create");
                for (const currentObj of userCart) {
                    yield product_1.default.update({
                        numbersOfProductAvailable: sequelize_1.default.literal(`"numbersOfProductAvailable" - ${currentObj.quantity}`),
                    }, {
                        where: { id: currentObj.productId },
                        transaction,
                    });
                }
                yield cartsItems_1.default.destroy({ where: { cartId }, transaction });
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
ShopController.BASE_URL = process.env.BASE_URL || "http://localhost:3000";
exports.default = ShopController;
