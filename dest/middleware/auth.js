"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorResponse_1 = require("../response/error/ErrorResponse");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// class Auth {
const Auth = (req, res, next) => {
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
};
// }
exports.default = Auth;
