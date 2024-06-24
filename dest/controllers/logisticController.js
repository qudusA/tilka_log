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
const package_1 = __importDefault(require("../models/package"));
const addressModel_1 = __importDefault(require("../models/addressModel"));
class LogisticController {
    static assignDeliveryToDriver(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { orderIds, packageIds } = req.query;
                const { driverId } = req.params;
                if ((!orderIds && !packageIds) || (orderIds && packageIds)) {
                    return res.status(400).json({
                        message: "You must provide either orderIds or packageIds, but not both.",
                        status: "error",
                        statusCode: 400,
                        data: {},
                    });
                }
                const foundAdmin = yield userModel_1.default.findOne({
                    where: { id: req.userId, role: "admin" },
                });
                if (!foundAdmin) {
                    transaction.rollback();
                    const error = new ErrorResponse_1.ErrorResponse("admin not found", "not found", 404, "admin not found");
                    return res.status(404).json(error);
                }
                const foundDriver = (yield userModel_1.default.findByPk(driverId));
                console.log("found driver", foundDriver);
                if (!foundDriver) {
                    transaction.rollback();
                    const error = new ErrorResponse_1.ErrorResponse("driver not found", "not found ", 404, "driver not found");
                    return res.status(404).json(error);
                }
                if (foundDriver.dataValues.role !== "courier") {
                    transaction.rollback();
                    const err = new ErrorResponse_1.ErrorResponse("you can't assign this user", "401", 401, "you can't assign this user");
                    return res.status(401).json(err);
                }
                // let nonProccessOrders = undefined;
                let deliveries, count;
                if (orderIds) {
                    console.log("not undefine");
                    const nonProccessOrders = yield order_1.default.findAll({
                        where: {
                            id: { [sequelize_2.Op.in]: orderIds },
                            orderStatus: { [sequelize_2.Op.in]: ["On Hold", "Processing"] },
                        },
                    });
                    if (nonProccessOrders.length < 1) {
                        transaction.rollback();
                        const error = new ErrorResponse_1.ErrorResponse("order not found", "not found", 404, "order not found");
                        transaction.rollback();
                        return res.status(404).json(error);
                    }
                    deliveries = yield Promise.all(nonProccessOrders.map((order) => __awaiter(this, void 0, void 0, function* () {
                        const delivery = yield delivery_1.default.create({
                            orderId: order.id,
                            driverId: foundDriver.id,
                        }, { transaction });
                        return delivery;
                    })));
                    [count] = yield order_1.default.update({ orderStatus: "Out for Delivery" }, {
                        where: {
                            id: nonProccessOrders.map((order) => order.id),
                        },
                        transaction,
                    });
                }
                else {
                    console.log("else block");
                    const nonProccessPackage = yield package_1.default.findAll({
                        where: {
                            id: { [sequelize_2.Op.in]: packageIds },
                            status: { [sequelize_2.Op.in]: ["On Hold", "Processing"] },
                        },
                    });
                    if (nonProccessPackage.length < 1) {
                        yield transaction.rollback();
                        const error = new ErrorResponse_1.ErrorResponse("no items to process", "not found", 404, "no package to process");
                        return res.status(404).json(error);
                    }
                    deliveries = yield Promise.all(nonProccessPackage.map((pack) => __awaiter(this, void 0, void 0, function* () {
                        const delivery = yield delivery_1.default.create({
                            packageId: pack.id,
                            driverId: foundDriver.id,
                        }, { transaction });
                        return delivery;
                    })));
                    [count] = yield package_1.default.update({ status: "Driver Assiged" }, {
                        where: {
                            id: nonProccessPackage.map((pack) => pack.id),
                        },
                        transaction,
                    });
                }
                transaction.commit();
                res.status(201).json({
                    message: `${count} data creation successful`,
                    status: "created",
                    statusCode: 201,
                    data: deliveries,
                });
            }
            catch (error) {
                yield transaction.rollback();
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
            // const { orderId } = req.params;
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { latitude, longitude, orderId, packageId } = req.query;
                if ((packageId && orderId) || (!packageId && !orderId)) {
                    return res.status(400).json({
                        message: "wrong input id",
                        status: "error",
                        statusCode: 404,
                        data: {},
                    });
                }
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
                const latit = latitude || lat;
                const long = longitude || lon;
                let foundDelivery = undefined;
                if (orderId) {
                    foundDelivery = yield delivery_1.default.findOne({ where: { orderId } });
                    if (!foundDelivery) {
                        transaction.rollback();
                        return res.status(400).json({
                            message: "wrong order id",
                            status: "error",
                            statusCode: 404,
                            data: {},
                        });
                    }
                    foundDelivery.longitude = long;
                    foundDelivery.latitude = latit;
                    yield foundDelivery.save();
                }
                else {
                    foundDelivery = yield delivery_1.default.findOne({ where: { packageId } });
                    if (!foundDelivery) {
                        transaction.rollback();
                        return res.status(400).json({
                            message: "wrong pack id",
                            status: "error",
                            statusCode: 404,
                            data: {},
                        });
                    }
                    foundDelivery.longitude = long;
                    foundDelivery.latitude = latit;
                    yield foundDelivery.save();
                }
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
                    raw: true,
                    include: [
                        {
                            model: order_1.default,
                            as: "order",
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
                if (foundDelivery["order.userId"] !== req.userId &&
                    foundDelivery["order.oderStatus"] !== "Out for Delivery") {
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
    static sendPackage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { packageName, weight, receiverCity, receiverCountry, receiverState, receiverStreet, receiverZip, receiverHouseNumber, senderCity, senderCountry, senderState, senderStreet, senderZip, senderHouseNumber, } = req.body;
                const { userId } = req;
                const { receiverEmail } = req.query;
                const foundUser = yield userModel_1.default.findAll({
                    where: { [sequelize_2.Op.or]: { id: userId, email: receiverEmail } },
                    raw: true,
                });
                if (foundUser.length < 2) {
                    return res.status(404).json("wrong");
                }
                const [user1, user2] = foundUser;
                let sender = undefined;
                let receiver = undefined;
                if (user1.id === +userId) {
                    sender = user1;
                    receiver = user2;
                }
                else {
                    sender = user2;
                    receiver = user1;
                }
                const func = function (city, country, state, street, zip, houseNumber, user) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let foundUserAddress = undefined;
                        foundUserAddress = yield addressModel_1.default.findOne({
                            where: {
                                city,
                                street,
                                houseNumber,
                                userId: user.id,
                            },
                        });
                        if (!foundUserAddress) {
                            const curretAddress = yield addressModel_1.default.update({ deliveredTo: false }, { where: { userId: user.id, deliveredTo: true }, transaction });
                            foundUserAddress = yield addressModel_1.default.create({
                                userId: user.id,
                                city,
                                country,
                                houseNumber,
                                state,
                                street,
                                zip,
                            }, { transaction });
                        }
                        else {
                            const curretAddress = yield addressModel_1.default.update({ deliveredTo: false }, { where: { userId, deliveredTo: true }, transaction });
                            foundUserAddress.deliveredTo = true;
                            yield foundUserAddress.save();
                        }
                        return foundUserAddress;
                    });
                };
                yield func(receiverCity, receiverCountry, receiverState, receiverStreet, receiverZip, receiverHouseNumber, receiver);
                yield func(senderCity, senderCountry, senderState, senderStreet, senderZip, senderHouseNumber, sender);
                const createdPackage = yield package_1.default.create({
                    packageName,
                    receiverId: receiver.id,
                    senderId: sender.id,
                });
                transaction.commit();
                res.status(200).json({
                    message: "success",
                    status: "success",
                    statusCode: 200,
                    data: createdPackage,
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
    static getAllPackages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allPackage = yield package_1.default.findAll({
                    where: { status: "Processing" },
                });
                if (allPackage.length < 1) {
                    return res.json(200).json({
                        message: "package not found",
                        status: "not found",
                        statusCode: 200,
                        data: allPackage,
                    });
                }
                res.status(200).json({
                    message: "package fetched",
                    status: "fetch",
                    statusCode: 200,
                    data: allPackage,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getAllAssingedDelivery(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req;
                const foundUser = yield userModel_1.default.findByPk(userId);
                if (!foundUser) {
                    return res.json({
                        message: "not found",
                        status: "not found",
                        statusCode: 404,
                        data: "not found",
                    });
                }
                if (foundUser.role !== "courier") {
                    return res.json({
                        message: "you dont have clearance for this task",
                        status: "unAuthorized",
                        statusCode: 401,
                        data: "you dont have clearance for this task",
                    });
                }
                const foundDelivery = yield delivery_1.default.findAll({
                    where: { driverId: foundUser.id },
                    include: [{ model: package_1.default, as: "package" }],
                });
                if (foundDelivery.length < 1) {
                    return res.json({
                        message: "not found",
                        status: "not found",
                        statusCode: 404,
                        data: foundDelivery,
                    });
                }
                res.status(200).json({
                    message: "delivery fetched",
                    status: "success",
                    statusCode: 200,
                    data: foundDelivery,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getPackageToEdit(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { edit } = req.query;
                const { packageId } = req.params;
                const { userId } = req;
                const foundUser = yield userModel_1.default.findByPk(userId);
                if (!foundUser) {
                    return res.json({
                        message: "not found",
                        status: "not found",
                        statusCode: 404,
                        data: "not found",
                    });
                }
                if (foundUser.role !== "courier") {
                    return res.json({
                        message: "you dont have clearance for this task",
                        status: "unAuthorized",
                        statusCode: 401,
                        data: "you dont have clearance for this task",
                    });
                }
                const foundPackage = yield package_1.default.findByPk(packageId);
                if (!foundPackage) {
                    return res.status(400).json({});
                }
                if (foundPackage.updateCount >= 2) {
                    return res.status(401).json({
                        message: "this item has been previously updated by you",
                        status: "unAuthorized",
                        statusCode: 401,
                        data: {},
                    });
                }
                res.status(200).json({
                    message: "product fetched",
                    status: "success",
                    statusCode: 200,
                    data: foundPackage,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static updateWeight(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { edit } = req.query;
                const { packageId } = req.params;
                const { weight } = req.body;
                const { userId } = req;
                const foundUser = yield userModel_1.default.findByPk(userId);
                if (!foundUser) {
                    return res.json({
                        message: "not found",
                        status: "not found",
                        statusCode: 404,
                        data: "not found",
                    });
                }
                if (foundUser.role !== "courier") {
                    return res.json({
                        message: "you dont have clearance for this task",
                        status: "unAuthorized",
                        statusCode: 401,
                        data: "you dont have clearance for this task",
                    });
                }
                const update = yield package_1.default.update({ weight }, { where: { id: packageId }, transaction, individualHooks: true });
                transaction.commit();
                res.status(201).json({
                    message: "update successful",
                    status: "update",
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
}
exports.default = LogisticController;
