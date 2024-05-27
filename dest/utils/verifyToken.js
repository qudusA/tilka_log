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
const tokenModel_1 = __importDefault(require("../models/tokenModel"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
class SaveToken {
    //   private id: number;
    //   private token: string;
    //   constructor(id: number, token: string) {
    //     this.id = id;
    //     this.token = token;
    //   }
    static saveTo(id, token, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenInstance = yield tokenModel_1.default.findOne({
                where: { token, isTokenValid: true, userId: +id },
                transaction,
            });
            if (!tokenInstance) {
                throw new ErrorResponse_1.ErrorResponse("invalid token", "error", 404, {});
            }
            if (tokenInstance.expirationTime < new Date(Date.now()) ||
                tokenInstance.isTokenValid === false) {
                tokenInstance.isTokenValid = false;
                yield tokenInstance.save({ transaction });
                throw new ErrorResponse_1.ErrorResponse("expired token", "error", 404, {});
            }
            tokenInstance.isTokenValid = false;
            yield tokenInstance.save({ transaction });
            return yield tokenInstance.getUser({ transaction });
        });
    }
}
exports.default = SaveToken;
