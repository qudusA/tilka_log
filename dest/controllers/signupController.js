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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUpController = void 0;
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sequelize_1 = __importDefault(require("../utils/sequelize"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const verifyToken_1 = __importDefault(require("../utils/verifyToken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const ErrorResponse_1 = require("../response/error/ErrorResponse");
class SignUpController {
    constructor() { }
    postSignUp(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const transaction = yield sequelize_1.default.transaction();
            try {
                const error = (0, express_validator_1.validationResult)(req);
                const err = new ErrorResponse_1.ErrorResponse("invalid data input", "error", 422, error.array());
                if (!error.isEmpty()) {
                    transaction.rollback();
                    return res.status(422).json(err);
                }
                const salt = yield bcrypt_1.default.genSalt(12);
                const hashPassword = yield bcrypt_1.default.hash(req.body.password, salt);
                let userName = "";
                if (!req.body.userName) {
                    const names = req.body.fullName.split(" ");
                    userName =
                        names[0][0].toUpperCase() +
                            names[1][0].toUpperCase() +
                            Math.trunc(Math.random() * 100) +
                            1;
                }
                else {
                    userName = req.body.userName;
                }
                const user = yield userModel_1.default.create({
                    email: req.body.email,
                    password: hashPassword,
                    fullName: req.body.fullName,
                    userName: userName,
                }, { transaction });
                let id, addres;
                const { state, city, zip, country, houseNumber, street } = req.body;
                if (state !== undefined &&
                    city !== undefined &&
                    zip !== undefined &&
                    country !== undefined &&
                    street !== undefined &&
                    houseNumber !== undefined) {
                    let address = yield user.createAddress({
                        city,
                        country,
                        state,
                        street,
                        houseNumber,
                        zip,
                    }, { transaction });
                    (_a = address.dataValues, { id } = _a, addres = __rest(_a, ["id"]));
                }
                const _b = user.dataValues, { password } = _b, rest = __rest(_b, ["password"]);
                const token = (0, uuid_1.v4)();
                const redirect = `${req.protocol}://${req.headers.host}${req.url}/verify?id=${rest.id}&token=${token}`;
                // const generateToken = new GenerateToken(token, user);
                // await generateToken.saveToken(transaction);
                // const transport = nodemailer.createTransport({
                //   service: "gmail",
                //   auth: {
                //     user: process.env.GMAIL_EMAIL,
                //     pass: process.env.GMAIL_PASSWORD,
                //   },
                // });
                // const options = {
                //   from: process.env.GMAIL_EMAIL,
                //   to: rest.email,
                //   subject: "ACCOUNT VERIFICATION",
                //   text: `             NOTIFICATION OF EMAIL VERIFICATION
                //   kindly click on the following link
                //   ${redirect}
                //   to verify your account with us.
                //   please note that this is a one time token and it expires in 10min.
                //   kindly ignore the mail if you do not signup on our website..
                //   `,
                // };
                // await transport.sendMail(options);
                yield transaction.commit();
                res.status(201).json({
                    status: "created",
                    statusCode: 201,
                    message: `user created successfully, kindly check your mail for verification, if you don not get any kindly try to signup with this email ${user.email} in the next 1 hr or use another email `,
                    data: Object.assign(Object.assign({}, rest), addres),
                });
            }
            catch (err) {
                yield transaction.rollback();
                next(err);
            }
        });
    }
    postVerify(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { id, token } = req.query;
                const userInstance = yield verifyToken_1.default.saveTo(id, token, transaction);
                userInstance.isVerified = true;
                yield userInstance.save({ transaction });
                yield transaction.commit();
                res.status(201).json({
                    status: "updated",
                    statusCode: 201,
                    message: "user created successfully",
                    data: {},
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
    postLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const error = (0, express_validator_1.validationResult)(req);
            const err = new ErrorResponse_1.ErrorResponse("invalid data input", "error", 422, error.array());
            if (!error.isEmpty())
                return res.status(422).json(err);
            const transaction = yield sequelize_1.default.transaction();
            try {
                const { email, password } = req.body;
                const foundUser = yield userModel_1.default.findOne({
                    where: { email },
                    transaction,
                });
                if (!foundUser)
                    throw new ErrorResponse_1.ErrorResponse("invalid email or password...", "errror", 404, {});
                if (!foundUser.isVerified)
                    throw new ErrorResponse_1.ErrorResponse("you have not verified yourself...", "errror", 422, {});
                const doMatch = yield bcrypt_1.default.compare(password, foundUser.password);
                if (!doMatch)
                    throw new ErrorResponse_1.ErrorResponse("invalid email or password....", "error", 404, {});
                const jwToken = yield jsonwebtoken_1.default.sign({
                    email,
                    userId: foundUser.id,
                    isUserVerified: foundUser.isVerified,
                    role: foundUser.role,
                }, process.env.TOKEN_SECRET, { expiresIn: "1h" });
                // jwt.sign()
                yield transaction.commit();
                res.status(200).json({
                    status: "success",
                    statusCode: 200,
                    message: "login",
                    data: jwToken,
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
    postForgetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const transaction = yield sequelize_1.default.transaction();
            const error = (0, express_validator_1.validationResult)(req);
            const err = new ErrorResponse_1.ErrorResponse("invalid data input", "error", 422, error.array());
            if (!error.isEmpty())
                return res.status(422).json(err);
            try {
                const foundUser = yield userModel_1.default.findOne({
                    where: { email },
                    transaction,
                });
                if (!foundUser)
                    throw new ErrorResponse_1.ErrorResponse("invalid email address...", "error", 404, {});
                if (!foundUser.isVerified)
                    throw new ErrorResponse_1.ErrorResponse("you have not verified yourself...", "errror", 422, {});
                const otp = Math.trunc(Math.random() * 999999 + 100000);
                const generateToken = new generateToken_1.default(String(otp), foundUser);
                yield generateToken.saveToken(transaction);
                const transport = nodemailer_1.default.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.GMAIL_EMAIL,
                        pass: process.env.GMAIL_PASSWORD,
                    },
                });
                const options = {
                    from: process.env.GMAIL_EMAIL,
                    to: foundUser.email,
                    subject: "CHANGE PASSWORD",
                    text: `             NOTIFICATION OF CHANGE OF PASSWORD
        kindly use the following OTP 
        ${otp} 
        to change your account account password.
        please note that this is a one time token and it expires in 10min.

        kindly ignore the mail if you do not initiate the request...
        `,
                };
                yield transport.sendMail(options);
                const redirect = `${req.protocol}://${req.headers.host}${req.url}/reset-password/${foundUser.id}`;
                yield transaction.commit();
                res.status(201).json({
                    status: "created",
                    statusCode: 201,
                    message: "kindly check you email for a one time otp",
                    data: {
                        redirect,
                    },
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
    postPasswordReset(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { password, token } = req.body;
            const transaction = yield sequelize_1.default.transaction();
            const error = (0, express_validator_1.validationResult)(req);
            console.log(id, password, token);
            const err = new ErrorResponse_1.ErrorResponse("invalid data input", "error", 422, error.array());
            if (!error.isEmpty())
                return res.status(422).json(err);
            try {
                const userInstance = yield verifyToken_1.default.saveTo(id, token, transaction);
                const salt = yield bcrypt_1.default.genSalt(12);
                const hashPassword = yield bcrypt_1.default.hash(password, salt);
                userInstance.password = hashPassword;
                yield userInstance.save({ transaction });
                yield transaction.commit();
                res.status(201).json({
                    status: "updated",
                    statusCode: 201,
                    message: "password reset successful...",
                    data: {},
                });
            }
            catch (error) {
                yield transaction.rollback();
                next(error);
            }
        });
    }
}
exports.SignUpController = SignUpController;
