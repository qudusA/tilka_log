import { NextFunction, Request, Response, response } from "express";
import { validationResult } from "express-validator";

import Order, { OrderType } from "../models/order";
import axios from "axios";
import { ErrorResponse } from "../response/error/ErrorResponse";
import sequelize from "../utils/sequelize";
import userModel from "../models/userModel";
import { Ok } from "../response/ok/okResponse";
import { Op } from "sequelize";
import Delivery from "../models/delivery";
import Package, { PackageAttribute } from "../models/package";
import Address from "../models/addressModel";

export default class LogisticController {
  static async assignDeliveryToDriver(
    req: Request<
      { driverId: string },
      {},
      {},
      { orderIds?: string[]; packageIds?: string[] }
    >,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const { orderIds, packageIds } = req.query;
      const { driverId } = req.params;
      if ((!orderIds && !packageIds) || (orderIds && packageIds)) {
        return res.status(400).json({
          message:
            "You must provide either orderIds or packageIds, but not both.",
          status: "error",
          statusCode: 400,
          data: {},
        });
      }
      const foundAdmin = await userModel.findOne({
        where: { id: req.userId, role: "admin" },
      });
      if (!foundAdmin) {
        transaction.rollback();
        const error = new ErrorResponse(
          "admin not found",
          "not found",
          404,
          "admin not found"
        );
        return res.status(404).json(error);
      }

      const foundDriver = (await userModel.findByPk(driverId)) as userModel;
      console.log("found driver", foundDriver);
      if (!foundDriver) {
        transaction.rollback();
        const error = new ErrorResponse(
          "driver not found",
          "not found ",
          404,
          "driver not found"
        );
        return res.status(404).json(error);
      }
      if (foundDriver.dataValues.role !== "courier") {
        transaction.rollback();
        const err = new ErrorResponse(
          "you can't assign this user",
          "401",
          401,
          "you can't assign this user"
        );
        return res.status(401).json(err);
      }

      // let nonProccessOrders = undefined;
      let deliveries: any, count: number;

      if (orderIds) {
        console.log("not undefine");
        const nonProccessOrders = await Order.findAll({
          where: {
            id: { [Op.in]: orderIds },
            orderStatus: { [Op.in]: ["On Hold", "Processing"] },
          },
        });

        if (nonProccessOrders.length < 1) {
          transaction.rollback();
          const error = new ErrorResponse(
            "order not found",
            "not found",
            404,
            "order not found"
          );
          transaction.rollback();
          return res.status(404).json(error);
        }

        deliveries = await Promise.all(
          nonProccessOrders.map(async (order) => {
            const delivery = await Delivery.create(
              {
                orderId: order.id,
                driverId: foundDriver.id,
              },
              { transaction }
            );

            return delivery;
          })
        );

        [count] = await Order.update(
          { orderStatus: "Out for Delivery" },
          {
            where: {
              id: nonProccessOrders.map((order) => order.id),
            },
            transaction,
          }
        );
      } else {
        console.log("else block");
        const nonProccessPackage = await Package.findAll({
          where: {
            id: { [Op.in]: packageIds },
            status: { [Op.in]: ["On Hold", "Processing"] },
          },
        });

        if (nonProccessPackage.length < 1) {
          await transaction.rollback();
          const error = new ErrorResponse(
            "no items to process",
            "not found",
            404,
            "no package to process"
          );
          return res.status(404).json(error);
        }

        deliveries = await Promise.all(
          nonProccessPackage.map(async (pack) => {
            const delivery = await Delivery.create(
              {
                packageId: pack.id,
                driverId: foundDriver.id,
              },
              { transaction }
            );

            return delivery;
          })
        );

        [count] = await Package.update(
          { status: "Driver Assiged" },
          {
            where: {
              id: nonProccessPackage.map((pack) => pack.id),
            },
            transaction,
          }
        );
      }

      transaction.commit();
      res.status(201).json({
        message: `${count} data creation successful`,
        status: "created",
        statusCode: 201,
        data: deliveries,
      });
    } catch (error: any) {
      await transaction.rollback();
      next(error);
    }
  }

  static async shearDriverLocation(
    req: Request<
      {},
      {},
      {},
      {
        latitude: string;
        longitude: string;
        orderId?: string;
        packageId?: string;
      }
    >,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      const error = new ErrorResponse(
        "invalide data",
        "error",
        422,
        err.array()
      );
      return res.status(422).json(error);
    }

    // const { orderId } = req.params;

    const transaction = await sequelize.transaction();
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
      const foundDriver = await userModel.findByPk(req.userId);
      if (!foundDriver) {
        transaction.rollback();
        const err = new ErrorResponse("user not found.", "4o4", 404, {});
        return res.status(404).json(err);
      }
      if (foundDriver.role !== "courier") {
        transaction.rollback();
        const err = new ErrorResponse("unAuthorized task...", "401", 401, {});
        return res.status(401).json(err);
      }
      console.log("it got heere");
      const ips =
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "";

      const response = await axios.get("https://api.ipify.org?format=json");

      const locationresponse = await axios.get(
        `http://ip-api.com/json/${response.data.ip}`
      );
      if (locationresponse.data.status === "fail") {
        const err = new ErrorResponse(
          locationresponse.data.message,
          "500",
          500,
          {}
        );
        return res.status(500).json(err);
      }
      const { lat, lon } = locationresponse.data;

      const latit = latitude || lat;
      const long = longitude || lon;
      let foundDelivery = undefined;
      if (orderId) {
        foundDelivery = await Delivery.findOne({ where: { orderId } });
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
        await foundDelivery.save();
      } else {
        foundDelivery = await Delivery.findOne({ where: { packageId } });
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
        await foundDelivery.save();
      }

      transaction.commit();
      res.status(201).json({
        message: "success",
        status: "success",
        statusCode: 201,
        data: { latitude: latit, longitude: long },
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
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

  static async trackDriverLocation(
    req: Request<{ orderId: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    try {
      type order = {
        "order.id": number;
        "order.userId": number;
        "order.deliveryAddress": number;
        "order.orderDate": Date;
        "order.orderStatus": string;
        "order.totalAmount": number;
        "order.createdAt": Date;
        "order.updatedAt": Date;
      };

      type combinedType = OrderType & order;
      const { orderId } = req.params;
      const foundDelivery: any = await Delivery.findOne({
        where: { orderId },
        raw: true,
        include: [
          {
            model: Order,
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

      if (
        foundDelivery["order.userId"] !== req.userId &&
        foundDelivery["order.oderStatus"] !== "Out for Delivery"
      ) {
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
    } catch (error) {
      next(error);
    }
  }

  static async sendPackage(
    req: Request<
      {},
      {},
      {
        packageName: string;
        weight: string;
        receiverCity: string;
        receiverCountry: string;
        receiverState: string;
        receiverStreet: string;
        receiverZip: string;
        receiverHouseNumber: string;
        senderCity: string;
        senderCountry: string;
        senderState: string;
        senderStreet: string;
        senderZip: string;
        senderHouseNumber: string;
      },
      { receiverEmail: string }
    >,
    res: Response,
    next: NextFunction
  ) {
    const error = validationResult(req);
    if (!error.array()) {
      return res.status(422).json({
        message: "invalid data input",
        status: "validation",
        statusCode: 422,
        data: error.array(),
      });
    }
    const transaction = await sequelize.transaction();
    try {
      const {
        packageName,
        weight,
        receiverCity,
        receiverCountry,
        receiverState,
        receiverStreet,
        receiverZip,
        receiverHouseNumber,
        senderCity,
        senderCountry,
        senderState,
        senderStreet,
        senderZip,
        senderHouseNumber,
      } = req.body;

      const { userId } = req;
      const { receiverEmail } = req.query;

      const foundUser = await userModel.findAll({
        where: { [Op.or]: { id: userId, email: receiverEmail } },
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
      } else {
        sender = user2;
        receiver = user1;
      }

      const func = async function (
        city: string,
        country: string,
        state: string,
        street: string,
        zip: string,
        houseNumber: string,
        user: userModel
      ) {
        let foundUserAddress = undefined;
        foundUserAddress = await Address.findOne({
          where: {
            city,
            street,
            houseNumber,
            userId: user.id,
          },
        });

        if (!foundUserAddress) {
          const curretAddress = await Address.update(
            { deliveredTo: false },
            { where: { userId: user.id, deliveredTo: true }, transaction }
          );

          foundUserAddress = await Address.create(
            {
              userId: user.id,
              city,
              country,
              houseNumber,
              state,
              street,
              zip,
            },
            { transaction }
          );
        } else {
          const curretAddress = await Address.update(
            { deliveredTo: false },
            { where: { userId, deliveredTo: true }, transaction }
          );

          foundUserAddress.deliveredTo = true;
          await foundUserAddress.save();
        }
        return foundUserAddress;
      };

      await func(
        receiverCity,
        receiverCountry,
        receiverState,
        receiverStreet,
        receiverZip,
        receiverHouseNumber,
        receiver
      );
      await func(
        senderCity,
        senderCountry,
        senderState,
        senderStreet,
        senderZip,
        senderHouseNumber,
        sender
      );

      const createdPackage = await Package.create({
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
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  static async getAllPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const allPackage = await Package.findAll({
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
    } catch (error) {
      next(error);
    }
  }

  static async getAllAssingedDelivery(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req;
      const foundUser = await userModel.findByPk(userId);
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
      const foundDelivery = await Delivery.findAll({
        where: { driverId: foundUser.id },
        include: [{ model: Package, as: "package" }],
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
    } catch (error) {
      next(error);
    }
  }
  static async getPackageToEdit(
    req: Request<{ packageId: string }, {}, {}, { edit: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { edit } = req.query;
      const { packageId } = req.params;
      const { userId } = req;
      const foundUser = await userModel.findByPk(userId);
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
      const foundPackage = await Package.findByPk(packageId);
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
    } catch (error) {
      next(error);
    }
  }

  static async updateWeight(
    req: Request<
      { packageId: string },
      {},
      { weight: string },
      { edit: string }
    >,
    res: Response,
    next: NextFunction
  ) {
    const error = validationResult(req);
    if (!error.array()) {
      return res.status(422).json({
        message: "invalid data input",
        status: "validation",
        statusCode: 422,
        data: error.array(),
      });
    }
    const transaction = await sequelize.transaction();
    try {
      const { edit } = req.query;
      const { packageId } = req.params;
      const { weight } = req.body;
      const { userId } = req;
      const foundUser = await userModel.findByPk(userId);
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
      const update = await Package.update(
        { weight },
        { where: { id: packageId }, transaction, individualHooks: true }
      );
      transaction.commit();
      res.status(201).json({
        message: "update successful",
        status: "update",
        statusCode: 201,
        data: {},
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }
}
