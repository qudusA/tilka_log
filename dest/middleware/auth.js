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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tokenModel_1 = __importDefault(require("../models/tokenModel"));
// class Auth {
const Auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.get("Authorization");
        if (!authHeader) {
            const error = new ErrorResponse_1.ErrorResponse("unAuthorized request", "unAuthorized not logged in", 401, {});
            return res.status(401).json(error);
        }
        const jwt = authHeader.startsWith("Bearer ");
        if (!jwt) {
            const error = new ErrorResponse_1.ErrorResponse("unAuthorized request", " unAuthorized not logged in", 401, {});
            return res.status(401).json(error);
        }
        const jwToken = authHeader.split(" ")[1];
        if (jwToken === " " || jwToken === null) {
            const error = new ErrorResponse_1.ErrorResponse("unAuthorized request", "unAuthorized", 401, {});
            return res.status(401).json(error);
        }
        const decode = jsonwebtoken_1.default.verify(jwToken, process.env.TOKEN_SECRET);
        if (!decode) {
            const error = new ErrorResponse_1.ErrorResponse("unAuthorized request", "unAuthorized", 401, {});
            return res.status(401).json(error);
        }
        const foundUser = yield userModel_1.default.findOne({
            where: { id: decode.userId },
            raw: true,
            include: [{ model: tokenModel_1.default, as: "tokens" }],
            order: [[{ model: tokenModel_1.default, as: "tokens" }, "id", "DESC"]],
        });
        if (!foundUser) {
            return res.status(401).json({
                message: "logged out already",
                status: "unAuthorized",
                statusCode: 401,
                data: {},
            });
        }
        if (!foundUser["tokens.isTokenValid"]) {
            return res.status(401).json({
                message: "logged out already",
                status: "unAuthorized",
                statusCode: 401,
                data: {},
            });
        }
        req.userId = decode.userId;
        req.email = decode.email;
        req.isUserVerified = decode.isUserVerified;
        req.role = decode.role;
        req.isAuth = true;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = Auth;
