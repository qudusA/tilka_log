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
const product_1 = __importDefault(require("../models/product"));
const userModel_1 = __importDefault(require("../models/userModel"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
const sequelize_1 = __importDefault(require("../utils/sequelize"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class SellersController {
    static postProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const err = (0, express_validator_1.validationResult)(req);
            if (!err.isEmpty()) {
                const error = new ErrorResponse_1.ErrorResponse("invalid input data", "error", 422, err.array());
                return res.status(422).json(error);
            }
            const transaction = yield sequelize_1.default.transaction();
            try {
                const sellerId = req.userId;
                const seller = yield userModel_1.default.findByPk(sellerId);
                if (!seller)
                    throw new ErrorResponse_1.ErrorResponse("user not found", "not found", 404, {});
                if (seller.role === "user" || seller.role === "courier")
                    throw new ErrorResponse_1.ErrorResponse("unAuthorised request", "error", 422, {});
                const productImage = req.file;
                const productImageUri = productImage === null || productImage === void 0 ? void 0 : productImage.path;
                const { productName, productPrice, productDescription, numbersOfProductAvailable, categories, } = req.body;
                const product = yield seller.createProduct({
                    productName,
                    productPrice,
                    productImageUri,
                    productDescription,
                    numbersOfProductAvailable,
                    categories,
                }, transaction);
                yield transaction.commit();
                res.status(201).json({
                    message: "product created",
                    status: "created",
                    statusCode: 201,
                    data: Object.assign({}, product.dataValues),
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
    static fetchASellerProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const seller = yield userModel_1.default.findByPk(req.userId);
                if (!seller) {
                    const err = new ErrorResponse_1.ErrorResponse("user not found", "error", 404, {});
                    return res.status(404).json(err);
                }
                if (seller.role !== "seller") {
                    const err = new ErrorResponse_1.ErrorResponse("unAuthorized", "error", 422, {});
                    return res.status(422).json(err);
                }
                const allSellersProducts = yield (seller === null || seller === void 0 ? void 0 : seller.getProducts({ raw: true }));
                if (allSellersProducts.length === 0) {
                    const err = new ErrorResponse_1.ErrorResponse("product not found", "error", 404, {});
                    return res.status(404).json(err);
                }
                res.status(200).json({
                    message: "success",
                    status: "success",
                    statusCode: 200,
                    data: allSellersProducts,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static updateProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const err = (0, express_validator_1.validationResult)(req);
            if (!err.isEmpty()) {
                const error = new ErrorResponse_1.ErrorResponse("invalid input data", "error", 422, err.array());
                return res.status(401).json(error);
            }
            const transaction = yield sequelize_1.default.transaction();
            try {
                let productImage = req.file;
                let productImageUri = productImage === null || productImage === void 0 ? void 0 : productImage.path;
                if (Object.keys(req.body).length === 0) {
                    const err = new ErrorResponse_1.ErrorResponse("no in put data", "error", 401, {});
                    return res.status(401).json(err);
                }
                let { productName, productPrice, productDescription, numbersOfProductAvailable, categories, } = req.body;
                const { prodId } = req.params;
                const foundProduct = yield product_1.default.findByPk(prodId);
                if (!foundProduct) {
                    const err = new ErrorResponse_1.ErrorResponse("product not found", "error prod", 404, {});
                    return res.status(404).json(err);
                }
                if (foundProduct.sellersId !== +req.userId) {
                    const err = new ErrorResponse_1.ErrorResponse("unAuthorized", "error seller", 401, {});
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
                }
                else {
                    const imagePath = path_1.default.join(__dirname, "..", "..");
                    const fullImagePath = path_1.default.join(imagePath, foundProduct.productImageUri.replace("\\", "/"));
                    const result = yield promises_1.default.unlink(fullImagePath);
                }
                yield foundProduct.update({
                    productName,
                    productImageUri,
                    categories,
                    numbersOfProductAvailable,
                    productPrice,
                    productDescription,
                }, { transaction });
                transaction.commit();
                res.status(201).json({
                    message: "update successful",
                    status: "updated",
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
    static deleteProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { prodId } = req.params;
                const foundProduct = yield product_1.default.findByPk(prodId);
                if (!foundProduct) {
                    transaction.rollback();
                    throw new ErrorResponse_1.ErrorResponse("product not found", "not found", 404, {});
                }
                if (foundProduct.sellersId !== +req.userId) {
                    transaction.rollback();
                    throw new ErrorResponse_1.ErrorResponse("you are not authorized to do that...", "unAuthorized", 401, {});
                }
                const imagePath = path_1.default.join(__dirname, "..", "..");
                const fullImagePath = path_1.default.join(imagePath, foundProduct === null || foundProduct === void 0 ? void 0 : foundProduct.productImageUri.replace("\\", "/"));
                yield promises_1.default.unlink(fullImagePath);
                yield (foundProduct === null || foundProduct === void 0 ? void 0 : foundProduct.destroy());
                transaction.commit();
                res.status(200).json({
                    message: "deletion successfull",
                    status: "success",
                    statusCode: 200,
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
exports.default = SellersController;
