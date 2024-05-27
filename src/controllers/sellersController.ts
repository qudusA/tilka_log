import { NextFunction, Request, Response } from "express";
import productModel, { ProductAttribute } from "../models/product";
import userModel from "../models/userModel";
import { ErrorResponse } from "../response/error/ErrorResponse";
import { Ok } from "../response/ok/okResponse";
import sequelize from "../utils/sequelize";

class SellersController {
  static async postProduct(
    req: Request<{}, {}, ProductAttribute>,
    res: Response<Ok>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const sellerId = req.userId;

      const seller = await userModel.findByPk(sellerId);
      console.log(seller);
      if (!seller)
        throw new ErrorResponse("unAuthorised request", "error", 422, {});

      if (seller.role === "user" || seller.role === "courier")
        throw new ErrorResponse("unAuthorised request", "error", 422, {});

      const productImage = req.file;

      if (!productImage)
        throw new ErrorResponse("kindly put product image", "error", 422, {});

      const productImageUri = productImage.path;

      const {
        productName,
        productPrice,
        productDescription,
        numbersOfProductAvailable,

        categories,
      } = req.body;

      const product = await seller.createProduct(
        {
          productName,
          productPrice,
          productImageUri,
          productDescription,
          numbersOfProductAvailable,
          categories,
        },
        transaction
      );

      await transaction.commit();
      res.status(201).json({
        message: "product created",
        status: "created",
        statusCode: 201,
        data: { ...product.dataValues },
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

export default SellersController;
