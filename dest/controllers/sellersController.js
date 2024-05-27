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
const userModel_1 = __importDefault(require("../models/userModel"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
const sequelize_1 = __importDefault(require("../utils/sequelize"));
class SellersController {
    static postProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                console.log("oalllllllllllll");
                const sellerId = req.userId;
                const seller = yield userModel_1.default.findByPk(sellerId);
                console.log(seller);
                if (!seller)
                    throw new ErrorResponse_1.ErrorResponse("unAuthorised request", "error", 422, {});
                if (seller.role === "user" || seller.role === "courier")
                    throw new ErrorResponse_1.ErrorResponse("unAuthorised request", "error", 422, {});
                const productImage = req.file;
                console.log(productImage);
                if (!productImage)
                    throw new ErrorResponse_1.ErrorResponse("kindly put product image", "error", 422, {});
                const productImageUri = productImage.path;
                console.log(productImageUri);
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
                    data: Object.assign({}, product),
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
}
exports.default = SellersController;
