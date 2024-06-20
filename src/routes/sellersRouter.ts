import { Router } from "express";
import { body } from "express-validator";

import SellersController from "../controllers/sellersController";
import Auth from "../middleware/auth";
import { ErrorResponse } from "../response/error/ErrorResponse";

const router = Router();

router.post(
  "/add-product",
  [
    body("productName")
      .isAlpha()
      .withMessage("product name nut be an alphabet"),
    body("productPrice").isNumeric().withMessage("price must be a number"),
    body("productImage").custom((value, { req }) => {
      if (!req.file) return false;

      if (!req.file) return false;
      if (!["jpeg", "jpg", "png"].includes(req.file.mimetype)) return false;

      return true;
    }),
    body(
      "productDescription",
      "descripton of product should be mor that 20 character"
    )
      .isString()
      .custom((value, { req }) => {
        if (!value || value.trim().length === 0) return false;
        if (value.length < 20) return false;
        return true;
      }),
    body(
      "numbersOfProductAvailable",
      "number of product must be a positive number"
    )
      .isNumeric()
      .custom((value) => {
        if (typeof +value === "number" && +value > 0) return false;

        return true;
      }),
    body("categories")
      .isAlpha()
      .withMessage("is can only be a single word without number"),
  ],
  Auth,
  SellersController.postProduct
);

router.get("/get-seller-product", Auth, SellersController.fetchASellerProducts);

router.put(
  "/product-update/:prodId",
  Auth,
  [
    body("productName")
      .optional()
      .isAlpha()
      .withMessage("product name nut be an alphabet"),
    body("productPrice")
      .optional()
      .isNumeric()
      .withMessage("price must be a number"),
    body("productImage")
      .optional()
      .custom((value, { req }) => {
        if (!req.file) return false;

        if (!req.file) return false;
        if (!["jpeg", "jpg", "png"].includes(req.file.mimetype)) return false;

        return true;
      }),
    body(
      "productDescription",
      "descripton of product should be more that 20 character"
    )
      .optional()
      .isString()
      .custom((value, { req }) => {
        if (!value || value.trim().length === 0) return false;
        if (value.length < 20) return false;
        return true;
      }),
    body(
      "numbersOfProductAvailable",
      "number of product must be a positive number or zero"
    )
      .optional()
      .isNumeric()
      .custom((value) => {
        if (typeof +value === "number" && +value >= 0) return false;

        return true;
      }),
    body("categories")
      .optional()
      .isAlpha()
      .withMessage("is can only be a single word without number"),
  ],
  SellersController.updateProduct
);

router.delete("/delete-product/:prodId", Auth, SellersController.deleteProduct);

export default router;
