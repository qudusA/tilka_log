import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

import productModel, { ProductAttribute } from "../models/product";
import userModel from "../models/userModel";
import { ErrorResponse } from "../response/error/ErrorResponse";
import { Ok } from "../response/ok/okResponse";
import sequelize from "../utils/sequelize";
import path from "path";
import fs from "fs/promises";

class SellersController {
  static async postProduct(
    req: Request<{}, {}, ProductAttribute>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      const error = new ErrorResponse(
        "invalid input data",
        "error",
        422,
        err.array()
      );

      return res.status(422).json(error);
    }
    const transaction = await sequelize.transaction();
    try {
      const sellerId = req.userId;

      const seller = await userModel.findByPk(sellerId);
      if (!seller)
        throw new ErrorResponse("user not found", "not found", 404, {});

      if (seller.role === "user" || seller.role === "courier")
        throw new ErrorResponse("unAuthorised request", "error", 422, {});

      const productImage = req.file;

      const productImageUri = productImage?.path;

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

  static async fetchASellerProducts(
    req: Request<{}, {}, ProductAttribute>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    try {
      const seller = await userModel.findByPk(req.userId);
      if (!seller) {
        const err: ErrorResponse = new ErrorResponse(
          "user not found",
          "error",
          404,
          {}
        );
        return res.status(404).json(err);
      }

      if (seller.role !== "seller") {
        const err: ErrorResponse = new ErrorResponse(
          "unAuthorized",
          "error",
          422,
          {}
        );
        return res.status(422).json(err);
      }
      const allSellersProducts = await seller?.getProducts({ raw: true });
      if (allSellersProducts.length === 0) {
        const err: ErrorResponse = new ErrorResponse(
          "product not found",
          "error",
          404,
          {}
        );
        return res.status(404).json(err);
      }
      res.status(200).json({
        message: "success",
        status: "success",
        statusCode: 200,
        data: allSellersProducts!,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(
    req: Request,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      const error = new ErrorResponse(
        "invalid input data",
        "error",
        422,
        err.array()
      );

      return res.status(401).json(error);
    }

    const transaction = await sequelize.transaction();
    try {
      let productImage = req.file;
      let productImageUri = productImage?.path;
      if (Object.keys(req.body).length === 0) {
        const err = new ErrorResponse("no in put data", "error", 401, {});
        return res.status(401).json(err);
      }

      let {
        productName,
        productPrice,
        productDescription,
        numbersOfProductAvailable,
        categories,
      } = req.body;

      const { prodId } = req.params;

      const foundProduct = await productModel.findByPk(prodId);

      if (!foundProduct) {
        const err = new ErrorResponse(
          "product not found",
          "error prod",
          404,
          {}
        );
        return res.status(404).json(err);
      }
      if (foundProduct.sellersId !== +req.userId) {
        const err = new ErrorResponse("unAuthorized", "error seller", 401, {});
        return res.status(401).json(err);
      }

      if (!productName) {
        productName = foundProduct.productName;
      }
      if (!productPrice) {
        productPrice = foundProduct.productPrice;
      }
      if (!productDescription) {
        productDescription = foundProduct.productDescription;
      }
      if (!numbersOfProductAvailable) {
        numbersOfProductAvailable = foundProduct.numbersOfProductAvailable;
      }
      if (!categories) {
        categories = foundProduct.categories;
      }
      if (!productImageUri) {
        productImageUri = foundProduct.productImageUri;
      } else {
        const imagePath = path.join(__dirname, "..", "..");
        const fullImagePath = path.join(
          imagePath,
          foundProduct.productImageUri.replace("\\", "/")
        );

        const result = await fs.unlink(fullImagePath);
      }

      await foundProduct.update(
        {
          productName,
          productImageUri,
          categories,
          numbersOfProductAvailable,
          productPrice,
          productDescription,
        },
        { transaction }
      );

      transaction.commit();
      res.status(201).json({
        message: "update successful",
        status: "updated",
        statusCode: 201,
        data: {},
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  static async deleteProduct(
    req: Request<{ prodId: string }>,
    res: Response<Ok>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();
    try {
      const { prodId } = req.params;
      const foundProduct = await productModel.findByPk(prodId);
      if (!foundProduct) {
        transaction.rollback();
        throw new ErrorResponse("product not found", "not found", 404, {});
      }
      if (foundProduct.sellersId !== +req.userId) {
        transaction.rollback();
        throw new ErrorResponse(
          "you are not authorized to do that...",
          "unAuthorized",
          401,
          {}
        );
      }
      const imagePath = path.join(__dirname, "..", "..");
      const fullImagePath = path.join(
        imagePath,
        foundProduct?.productImageUri.replace("\\", "/")!
      );
      await fs.unlink(fullImagePath);
      await foundProduct?.destroy();
      transaction.commit();
      res.status(200).json({
        message: "deletion successfull",
        status: "success",
        statusCode: 200,
        data: {},
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  // TODO
  //TODO find product by id....
}

export default SellersController;
