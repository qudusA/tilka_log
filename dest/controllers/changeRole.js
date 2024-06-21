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
class ChangeRole {
    static changeRoleByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const foundSuperAdmin = yield userModel_1.default.findByPk(req.userId);
                if (!foundSuperAdmin) {
                    const err = new ErrorResponse_1.ErrorResponse("user not found", "404", 404, {});
                    return res.status(404).json(err);
                }
                if (foundSuperAdmin.role !== "admin") {
                    const err = new ErrorResponse_1.ErrorResponse("unAuthorized request", "error", 422, "");
                    return res.status(422).json(err);
                }
                const [count, updatedValue] = yield userModel_1.default.update({ role: req.query.role }, { where: { email: req.query.email }, returning: true, transaction });
                transaction.commit();
                res.status(200).json({
                    message: "update successfull",
                    status: "update",
                    statusCode: 201,
                    data: [],
                });
            }
            catch (error) {
                transaction.rollback();
                next(error);
            }
        });
    }
}
exports.default = ChangeRole;
