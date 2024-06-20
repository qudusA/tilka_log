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
const bcrypt_1 = __importDefault(require("bcrypt"));
class CommandLineRunner {
    static createSuperAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            const superAdmin = yield userModel_1.default.findOne({
                where: { email: "superAdmin@gmail.com" },
            });
            if (superAdmin) {
                console.log("super admin already exist...");
            }
            else {
                const hashPassword = yield bcrypt_1.default.hash("superAdmin1", 12);
                const superA = yield userModel_1.default.create({
                    email: "superAdmin@gmail.com",
                    fullName: "super admin",
                    password: hashPassword,
                    isVerified: true,
                    role: "admin",
                    userName: "SA1",
                });
            }
        });
    }
}
exports.default = CommandLineRunner;
