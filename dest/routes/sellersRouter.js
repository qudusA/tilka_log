"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const sellersController_1 = __importDefault(require("../controllers/sellersController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
router.post("/add-product", [
    (0, express_validator_1.body)("productName")
        .isString()
        .withMessage("product name must be alphabet or mixture of alphabet and number"),
    (0, express_validator_1.body)("productPrice", "price must be positive")
        .isNumeric()
        .withMessage("price must be a number")
        .custom((value) => {
        if (typeof +value === "number" && +value <= 0)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("productImage").custom((value, { req }) => {
        if (!req.file)
            return false;
        if (!["jpeg", "jpg", "png"].includes(req.file.mimetype.split("/")[1]))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("productDescription", "descripton of product should be more that 20 character")
        .isString()
        .custom((value, { req }) => {
        if (!value || value.trim().length === 0)
            return false;
        if (value.length < 20)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("numbersOfProductAvailable", "number of product must be a positive number")
        .isNumeric()
        .custom((value) => {
        if (typeof +value === "number" && +value <= 0)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("categories")
        .isAlpha()
        .withMessage("is can only be a single word without number"),
], auth_1.default, sellersController_1.default.postProduct);
router.get("/get-seller-product", auth_1.default, sellersController_1.default.fetchASellerProducts);
router.put("/product-update/:prodId", auth_1.default, [
    (0, express_validator_1.body)("productName")
        .optional()
        .isString()
        .withMessage("product name must be alphabet or mixture of alphabet and number"),
    (0, express_validator_1.body)("productPrice", "price must be positive")
        .optional()
        .isNumeric()
        .withMessage("price must be a number")
        .custom((value) => {
        if (typeof +value === "number" && +value <= 0)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("productImage")
        .optional()
        .custom((value, { req }) => {
        if (!req.file)
            return false;
        if (!["jpeg", "jpg", "png"].includes(req.file.mimetype.split("/")[1]))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("productDescription", "descripton of product should be more that 20 character")
        .optional()
        .isString()
        .custom((value, { req }) => {
        if (!value || value.trim().length === 0)
            return false;
        if (value.length < 20)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("numbersOfProductAvailable", "number of product must be a positive number")
        .optional()
        .isNumeric()
        .custom((value) => {
        if (typeof +value === "number" && +value < 0)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("categories")
        .optional()
        .isAlpha()
        .withMessage("is can only be a single word without number"),
], sellersController_1.default.updateProduct);
router.delete("/delete-product/:prodId", auth_1.default, sellersController_1.default.deleteProduct);
exports.default = router;
