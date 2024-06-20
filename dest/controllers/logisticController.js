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
const express_validator_1 = require("express-validator");
const order_1 = __importDefault(require("../models/order"));
const axios_1 = __importDefault(require("axios"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
const sequelize_1 = __importDefault(require("../utils/sequelize"));
const userModel_1 = __importDefault(require("../models/userModel"));
const sequelize_2 = require("sequelize");
const delivery_1 = __importDefault(require("../models/delivery"));
class LogisticController {
    static assignDeliveryToDriver(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const foundAdmin = yield userModel_1.default.findOne({
                    where: { id: req.userId, role: "admin" },
                });
                if (!foundAdmin) {
                    transaction.rollback();
                    const error = new ErrorResponse_1.ErrorResponse("user not found", "not found", 404, {});
                    return res.status(404).json(error);
                }
                const { orderIds } = req.body;
                const { driverId } = req.params;
                const foundDriver = yield userModel_1.default.findByPk(driverId);
                if (!foundDriver) {
                    transaction.rollback();
                    const error = new ErrorResponse_1.ErrorResponse("user not found", "not found ", 404, {});
                    return res.status(404).json(error);
                }
                if (foundDriver.role !== "courier") {
                    transaction.rollback();
                    const err = new ErrorResponse_1.ErrorResponse("you can't assign this user", "401", 401, {});
                    return res.status(401).json(err);
                }
                const nonProccessOrders = yield order_1.default.findAll({
                    where: {
                        id: { [sequelize_2.Op.in]: orderIds },
                        orderStatus: { [sequelize_2.Op.in]: ["On Hold", "Processing"] },
                    },
                });
                if (nonProccessOrders.length < 1) {
                    transaction.rollback();
                    const error = new ErrorResponse_1.ErrorResponse("order not found", "not found", 404, {});
                    return res.status(404).json(error);
                }
                const deliveries = yield foundDriver.ctreateDeliverys(nonProccessOrders);
                yield order_1.default.update({ orderStatus: "Out for Delivery" }, {
                    where: {
                        id: nonProccessOrders.map((order) => order.id),
                    },
                    transaction,
                });
                transaction.commit();
                res.status(201).json({
                    message: "all data creation successful",
                    status: "created",
                    statusCode: 201,
                    data: deliveries,
                });
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
    static shearDriverLocation(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const err = (0, express_validator_1.validationResult)(req);
            if (!err.isEmpty()) {
                const error = new ErrorResponse_1.ErrorResponse("invalide data", "error", 422, err.array());
                return res.status(422).json(error);
            }
            const { orderId } = req.params;
            const transaction = yield sequelize_1.default.transaction();
            try {
                const foundDriver = yield userModel_1.default.findByPk(req.userId);
                if (!foundDriver) {
                    transaction.rollback();
                    const err = new ErrorResponse_1.ErrorResponse("user not found.", "4o4", 404, {});
                    return res.status(404).json(err);
                }
                if (foundDriver.role !== "courier") {
                    transaction.rollback();
                    const err = new ErrorResponse_1.ErrorResponse("unAuthorized task...", "401", 401, {});
                    return res.status(401).json(err);
                }
                console.log("it got heere");
                const ips = req.headers["x-real-ip"] ||
                    req.headers["x-forwarded-for"] ||
                    req.socket.remoteAddress ||
                    "";
                const response = yield axios_1.default.get("https://api.ipify.org?format=json");
                const locationresponse = yield axios_1.default.get(`http://ip-api.com/json/${response.data.ip}`);
                if (locationresponse.data.status === "fail") {
                    const err = new ErrorResponse_1.ErrorResponse(locationresponse.data.message, "500", 500, {});
                    return res.status(500).json(err);
                }
                const { lat, lon } = locationresponse.data;
                const { latitude, longitude } = req.query;
                const latit = latitude || lat;
                const long = longitude || lon;
                const foundOrder = yield order_1.default.findByPk(orderId);
                if (!foundOrder) {
                    const err = new ErrorResponse_1.ErrorResponse("no order found...", "404", 404, {});
                    return res.status(404).json(err);
                }
                yield foundOrder.createDelivery({
                    driverId: +req.userId,
                    latitude: latit,
                    longitude: long,
                }, { transaction });
                transaction.commit();
                res.status(201).json({
                    message: "success",
                    status: "success",
                    statusCode: 201,
                    data: { latitude: latit, longitude: long },
                });
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
    // static async assignDeliveryToDriver(
    //   req: Request<{ driverId: string; orderId: string }>,
    //   res: Response<Ok | ErrorResponse>,
    //   next: NextFunction
    // ) {
    //   const transaction = await sequelize.transaction();
    //   try {
    //     const { driverId, orderId } = req.params;
    //     const foundAdmin = await userModel.findByPk(req.userId);
    //     if (!foundAdmin) {
    //       transaction.rollback();
    //       const err = new ErrorResponse("user not found", "404", 404, {});
    //       return res.status(404).json(err);
    //     }
    //     if (foundAdmin.role !== "admin") {
    //       transaction.rollback();
    //       const err = new ErrorResponse("unAuthorized task...", "401", 401, {});
    //       return res.status(401).json(err);
    //     }
    //     const foundDriver = await userModel.findByPk(+driverId);
    //     if (!foundDriver) {
    //       transaction.rollback();
    //       const err = new ErrorResponse("driver not found", "404", 404, {});
    //       return res.status(404).json(err);
    //     }
    //     if (foundDriver.role !== "courier") {
    //       transaction.rollback();
    //       const err = new ErrorResponse(
    //         "you can't assign this user",
    //         "401",
    //         401,
    //         {}
    //       );
    //       return res.status(401).json(err);
    //     }
    //     const foundOrder = await Order.findOne({
    //       where: {
    //         id: orderId,
    //         orderStatus: { [Op.in]: ["On Hold", "Processing"] },
    //       },
    //     });
    //     if (!foundOrder) {
    //       transaction.rollback();
    //       return res.status(404).json({
    //         message: "order already assigned to a driver",
    //         status: "not found",
    //         statusCode: 404,
    //         data: {},
    //       });
    //     }
    //     const delivery = await Delivery.create({
    //       driverId: +driverId,
    //       orderId: +orderId,
    //     });
    //     await foundOrder.update({ orderStatus: "Out for Delivery" });
    //     await transaction.commit();
    //     res.status(201).json({
    //       message: "delivery assigned to driver",
    //       status: "success",
    //       statusCode: 201,
    //       data: delivery,
    //     });
    //   } catch (error) {
    //     transaction.rollback();
    //     next(error);
    //   }
    // }
    static trackDriverLocation(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const foundDelivery = yield delivery_1.default.findOne({
                    where: { orderId },
                    include: [
                        {
                            model: order_1.default,
                            as: "orders",
                        },
                    ],
                });
                if (!foundDelivery) {
                    return res.status(404).json({
                        message: "item not found",
                        status: "not found",
                        statusCode: 404,
                        data: {},
                    });
                }
                if (foundDelivery["orders.userId"] !== req.userId &&
                    foundDelivery["orders.oderStatus"] !== "out for delivery") {
                    return res.status(404).json({
                        message: "no order to track",
                        status: "not found",
                        statusCode: 404,
                        data: {},
                    });
                }
                const { latitude, longitude } = foundDelivery;
                res.status(200).json({
                    message: "tracking successfull",
                    status: "success",
                    statusCode: 200,
                    data: { lat: latitude, lon: longitude },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = LogisticController;
