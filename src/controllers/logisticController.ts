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

export default class LogisticController {
  static async assignDeliveryToDriver(
    req: Request<{ driverId: string }, {}, { orderIds: string[] }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const foundAdmin = await userModel.findOne({
        where: { id: req.userId, role: "admin" },
      });
      if (!foundAdmin) {
        transaction.rollback();
        const error = new ErrorResponse("user not found", "not found", 404, {});
        return res.status(404).json(error);
      }
      const { orderIds } = req.body;
      const { driverId } = req.params;
      const foundDriver = await userModel.findByPk(driverId);
      if (!foundDriver) {
        transaction.rollback();
        const error = new ErrorResponse(
          "user not found",
          "not found ",
          404,
          {}
        );
        return res.status(404).json(error);
      }
      if (foundDriver.role !== "courier") {
        transaction.rollback();
        const err = new ErrorResponse(
          "you can't assign this user",
          "401",
          401,
          {}
        );
        return res.status(401).json(err);
      }

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
          {}
        );
        return res.status(404).json(error);
      }

      const deliveries = await foundDriver.ctreateDeliverys(nonProccessOrders);

      await Order.update(
        { orderStatus: "Out for Delivery" },
        {
          where: {
            id: nonProccessOrders.map((order) => order.id),
          },
          transaction,
        }
      );

      transaction.commit();
      res.status(201).json({
        message: "all data creation successful",
        status: "created",
        statusCode: 201,
        data: deliveries,
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  static async shearDriverLocation(
    req: Request<
      { orderId: string },
      {},
      {},
      { latitude: string; longitude: string }
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

    const { orderId } = req.params;

    const transaction = await sequelize.transaction();
    try {
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
      const { latitude, longitude } = req.query;
      const latit = latitude || lat;
      const long = longitude || lon;

      const foundOrder: Order | null = await Order.findByPk(orderId);
      if (!foundOrder) {
        const err = new ErrorResponse("no order found...", "404", 404, {});
        return res.status(404).json(err);
      }

      await foundOrder.createDelivery(
        {
          driverId: +req.userId,
          latitude: latit,
          longitude: long,
        },
        { transaction }
      );
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
        "orders.userId": number;
        "orders.oderStatus": string;
      };

      type combinedType = OrderType & order;
      const { orderId } = req.params;
      const foundDelivery: any = await Delivery.findOne({
        where: { orderId },
        include: [
          {
            model: Order,
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

      if (
        foundDelivery["orders.userId"] !== req.userId &&
        foundDelivery["orders.oderStatus"] !== "out for delivery"
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
}
