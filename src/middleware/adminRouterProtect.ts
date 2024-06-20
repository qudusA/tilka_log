import { NextFunction, Request, Response } from "express";
import userModel from "../models/userModel";
import { ErrorResponse } from "../response/error/ErrorResponse";

export const adminRouteProtect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const admin = await userModel.findByPk(req.userId);
  if (!admin) {
    const err = new ErrorResponse(
      "kindly login or signup",
      "unAuthorized",
      422,
      {}
    );
    return res.status(422).json(err);
  }

  if (admin.role !== "admin") {
    const err = new ErrorResponse(
      "you can't perform this task",
      "unAuthorized",
      422,
      {}
    );
    return res.status(422).json(err);
  }

  next();
};
