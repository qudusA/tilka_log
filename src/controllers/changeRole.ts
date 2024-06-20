import { NextFunction, Request, Response } from "express";
import UserModel from "../models/userModel";
import { ErrorResponse } from "../response/error/ErrorResponse";
import { Ok } from "../response/ok/okResponse";
import sequelize from "../utils/sequelize";

class ChangeRole {
  static async changeRoleByAdmin(
    req: Request<{}, {}, {}, { email: string; role: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const foundSuperAdmin = await UserModel.findByPk(req.userId);
      if (!foundSuperAdmin) {
        const err = new ErrorResponse("user not found", "404", 404, {});
        return res.status(404).json(err);
      }
      if (foundSuperAdmin.role !== "admin") {
        const err = new ErrorResponse("unAuthorized request", "error", 422, "");
        return res.status(422).json(err);
      }
      const [count, updatedValue] = await UserModel.update(
        { role: req.query.role },
        { where: { email: req.query.email }, returning: true, transaction }
      );

      transaction.commit();

      res.status(200).json({
        message: "update successfull",
        status: "update",
        statusCode: 201,
        data: [],
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }
}

export default ChangeRole;
