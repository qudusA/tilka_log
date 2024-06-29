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
        await transaction.rollback();
        return res
          .status(404)
          .json(
            new ErrorResponse(
              "admin not found",
              "not found",
              404,
              "admin not found"
            )
          );
      }

      const foundDriver = (await userModel.findByPk(driverId)) as userModel;
      if (!foundDriver) {
        await transaction.rollback();
        return res
          .status(404)
          .json(
            new ErrorResponse(
              "driver not found",
              "not found",
              404,
              "driver not found"
            )
          );
      }
      if (foundDriver.dataValues.role !== "courier") {
        await transaction.rollback();
        return res
          .status(401)
          .json(
            new ErrorResponse(
              "you can't assign this user",
              "401",
              401,
              "you can't assign this user"
            )
          );
      }

      const convertToArray = (value: string | string[]): string[] => {
        return Array.isArray(value) ? value : [value];
      };

      const processOrders: any = async (items: string[]) => {
        const foundItems = await Order.findAll({
          where: {
            id: { [Op.in]: items },
            orderStatus: { [Op.in]: ["On Hold", "Processing"] },
          },
        });

        if (foundItems.length < 1) {
          await transaction.rollback();
          return res
            .status(404)
            .json(
              new ErrorResponse(
                "order not found",
                "not found",
                404,
                "order not found"
              )
            );
        }

        const deliveries = await Promise.all(
          foundItems.map(async (item) => {
            const delivery = await Delivery.create(
              {
                orderId: item.id,
                driverId: foundDriver.id,
              },
              { transaction }
            );
            return delivery;
          })
        );

        const [count] = await Order.update(
          {
            orderStatus: "Out for Delivery",
          },
          {
            where: { id: foundItems.map((item) => item.id) },
            transaction,
          }
        );

        return { deliveries, count };
      };

      const processPackages: any = async (items: string[]) => {
        const foundItems = await Package.findAll({
          where: {
            id: { [Op.in]: items },
            status: { [Op.in]: ["On Hold", "Processing"] },
          },
        });

        if (foundItems.length < 1) {
          await transaction.rollback();
          return res
            .status(404)
            .json(
              new ErrorResponse(
                "package not found",
                "not found",
                404,
                "package not found"
              )
            );
        }

        const deliveries = await Promise.all(
          foundItems.map(async (item) => {
            const delivery = await Delivery.create(
              {
                packageId: item.id,
                driverId: foundDriver.id,
              },
              { transaction }
            );
            return delivery;
          })
        );

        const [count] = await Package.update(
          {
            status: "Driver Assigned",
          },
          {
            where: { id: foundItems.map((item) => item.id) },
            transaction,
          }
        );

        return { deliveries, count };
      };

      let result;
      if (orderIds) {
        const orderIdsArray = convertToArray(orderIds);
        result = await processOrders(orderIdsArray);
      } else if (packageIds) {
        const packageIdsArray = convertToArray(packageIds);
        result = await processPackages(packageIdsArray);
      }

      await transaction.commit();
      res.status(201).json({
        message: `${result?.count} data creation successful`,
        status: "created",
        statusCode: 201,
        data: result?.deliveries,
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

  static async postDelivery(
    req: Request<{ orderId: string }, {}, {}, { delivered: string }>,
    res: Response<Ok>,
    next: NextFunction
  ) {
    const foundDriver = await userModel.findOne({
      where: { id: req.userId, role: "courier" },
    });

    // const foundDriver = await userModel.findOne({
    //   where: {
    //     id: req.userId,
    //     [Op.or]: [
    //       { role: "courier" },
    //       { role: "admin" }
    //     ]
    //   }
    // });

    if (!foundDriver) {
      return res.status(401).json({
        message: "you are not allow to perform this task...",
        status: "unAuthorized",
        statusCode: 401,
        data: {},
      });
    }
    console.log(foundDriver);
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { delivered } = req.query;
      if (!Boolean(delivered)) {
        await Order.update(
          { orderStatus: "not Delivered" },
          { where: { id: orderId }, transaction }
        );
        transaction.commit();
        return res.status(200).json({
          message: "item not delivered",
          status: "success",
          statusCode: 200,
          data: {},
        });
      }
      await Order.update(
        { orderStatus: "Delivered" },
        { where: { id: orderId }, transaction }
      );

      transaction.commit();
      res.status(200).json({
        message: "item delivered",
        status: "success",
        statusCode: 200,
        data: {},
      });
    } catch (error) {
      transaction.rollback();
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
