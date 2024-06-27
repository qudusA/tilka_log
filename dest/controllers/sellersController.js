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
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3clientHelper_1 = __importDefault(require("../utils/s3clientHelper"));
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
                const sharpBuff = yield (0, sharp_1.default)(productImage === null || productImage === void 0 ? void 0 : productImage.buffer)
                    .resize({ width: 1920, height: 1090, fit: "contain" })
                    .toBuffer();
                const productImageUri = crypto_1.default.randomBytes(32).toString("hex");
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: productImageUri,
                    ContentType: productImage === null || productImage === void 0 ? void 0 : productImage.mimetype,
                    Body: sharpBuff,
                };
                const img = new client_s3_1.PutObjectCommand(params);
                yield s3clientHelper_1.default.send(img);
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
                for (const img of allSellersProducts) {
                    const result = new client_s3_1.GetObjectCommand({
                        Bucket: process.env.BUCKET_NAME,
                        Key: img.productImageUri,
                    });
                    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3clientHelper_1.default, result, {
                        expiresIn: 3600,
                    });
                    img.productImageUri = url;
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
            var _a, _b;
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
                    productImageUri = foundProduct.productImageUri;
                    const imgBuf = yield (0, sharp_1.default)((_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer)
                        .resize({ width: 1, height: 1090, fit: "contain" })
                        .toBuffer();
                    const params = {
                        Key: productImageUri,
                        Bucket: process.env.BUCKET_NAME,
                        Body: imgBuf,
                        ContentType: (_b = req.file) === null || _b === void 0 ? void 0 : _b.mimetype,
                    };
                    const obj = new client_s3_1.PutObjectCommand(params);
                    yield s3clientHelper_1.default.send(obj);
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
                const params = {
                    Key: foundProduct.productImageUri,
                    Bucket: process.env.BUCKET_NAME,
                };
                const obj = new client_s3_1.DeleteObjectCommand(params);
                yield s3clientHelper_1.default.send(obj);
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
