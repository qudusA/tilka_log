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
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const userModel_1 = __importDefault(require("../models/userModel"));
const signupController_1 = require("../controllers/signupController");
const axios_1 = __importDefault(require("axios"));
const { postSignUp, postVerify, postLogin, postForgetPassword, postPasswordReset, } = new signupController_1.SignUpController();
const router = (0, express_1.Router)();
router.post("/signup", [
    (0, express_validator_1.body)("email", "this is not a valid email address...")
        .notEmpty()
        .isEmail()
        .normalizeEmail()
        .trim()
        .custom((value_1, _a) => __awaiter(void 0, [value_1, _a], void 0, function* (value, { req }) {
        const restrictedCountries = [
            "SERIA",
            "USA",
            "UKRAIN",
            "ISRAEL",
            // "NIGERIA",
        ];
        const response = yield axios_1.default.get("https://api.ipify.org?format=json");
        const locationResponse = yield axios_1.default.get(`http://ip-api.com/json/${response.data.ip}`);
        if (locationResponse.data.status === "fail") {
            return Promise.reject("something went wrong in your location");
        }
        if (restrictedCountries.includes(locationResponse.data.country.toUpperCase())) {
            return Promise.reject("Location country is restricted");
        }
        if (!/^[\w.-]+@gmail\.com$/.test(value)) {
            return Promise.reject("Email must end with gmail.com");
        }
        const userInstance = yield userModel_1.default.findOne({
            where: { email: value },
        });
        if (userInstance)
            return Promise.reject("user already exist");
        return true;
    })),
    (0, express_validator_1.body)("userName", "user name must be more than 3 character or leave it for it and it will be generated for you...").custom((value) => {
        if (value.length <= 2)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("fullName", "full name must contain surnname and first name and they must be more than three letters each...")
        .notEmpty()
        .rtrim()
        .ltrim()
        .custom((value) => {
        const splitName = value.split(" ");
        if (splitName.length === 1)
            return false;
        if (splitName[0].length < 3 || splitName[1].length < 3)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("password", "Password must contain at least one uppercase letter, one lowercase letter, and one number.")
        .notEmpty()
        .trim()
        .custom((value) => {
        if (!value)
            throw new Error("password is required...");
        const partter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
        const matchParttern = partter.test(value);
        if (!matchParttern)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("confirmPassword", "password doesn't match...")
        .notEmpty()
        .custom((value, { req }) => {
        if (value !== req.body.password)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("role").custom((value, { req }) => {
        if (value) {
            if (!["user", "seller", "courier"].includes(value))
                throw new Error("you can only signup as a user, seller or courier...");
        }
        return true;
    }),
    (0, express_validator_1.body)("street", "street name can only me alphabet...")
        .optional()
        .custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("city")
        .optional()
        .custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("state")
        .optional()
        .custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("zip", `this is not a valid code`)
        .isPostalCode("any")
        .optional()
        .custom((value, { req }) => {
        if (value.trim().length === 0 ||
            typeof value !== "string" ||
            value === undefined)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        if ((value === null || value === void 0 ? void 0 : value.length) !== 5)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("houseNumber")
        .optional()
        .custom((value, { req }) => {
        if (value.trim().length === 0 ||
            typeof value !== "string" ||
            value === undefined)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        if ((value === null || value === void 0 ? void 0 : value.length) > 5)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("country")
        .optional()
        .custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0) {
            return Promise.reject("Invalid value: non-string or empty string");
        }
        if (value.includes(",")) {
            return Promise.reject("Invalid value: contains a comma");
        }
        return true;
    }),
], postSignUp);
router.put("/signup/verify/", postVerify);
router.post("/login", [
    (0, express_validator_1.body)("email")
        .notEmpty()
        .withMessage("email is required...")
        .isEmail()
        .withMessage(" invalid input data")
        // .normalizeEmail()
        .trim(),
    (0, express_validator_1.body)("password")
        .trim()
        .custom((value, { req }) => {
        if (!value)
            throw new Error("password is required...");
        const partter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
        const matchParttern = partter.test(value);
        if (!matchParttern)
            return false;
        return true;
    }),
], postLogin);
router.post("/forgetpassword", [
    (0, express_validator_1.body)("email")
        .trim()
        .isEmail()
        .withMessage("this is not a valid email...")
        .custom((value_2, _b) => __awaiter(void 0, [value_2, _b], void 0, function* (value, { req }) {
        if (!/^[\w.-]+@gmail\.com$/.test(value)) {
            return Promise.reject("Email must end with gmail.com");
        }
        return true;
    })),
], postForgetPassword);
router.put("/forgetpassword/reset-password/:id", [
    (0, express_validator_1.body)("password", "Password must contain at least one uppercase letter, one lowercase letter, and one number.")
        .notEmpty()
        .trim()
        .custom((value) => {
        if (!value)
            throw new Error("password is required...");
        const partter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
        const matchParttern = partter.test(value);
        if (!matchParttern)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("confirmPassword", "password doesn't match...")
        .notEmpty()
        .custom((value, { req }) => {
        if (value !== req.body.password)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("token").isNumeric().withMessage("invalid otp"),
], postPasswordReset);
exports.default = router;
