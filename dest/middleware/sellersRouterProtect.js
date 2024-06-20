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
exports.adminRouteProtect = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
const adminRouteProtect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userModel_1.default.findByPk(req.userId);
    if (!user) {
        const err = new ErrorResponse_1.ErrorResponse("kindly login or signup", "unAuthorized", 422, {});
        return res.status(422).json(err);
    }
    if (user.role === "user" || user.role === "courier") {
        const err = new ErrorResponse_1.ErrorResponse("you can't perform this task", "unAuthorized", 422, {});
        return res.status(422).json(err);
    }
    next();
});
exports.adminRouteProtect = adminRouteProtect;
