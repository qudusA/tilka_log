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
const auth_1 = __importDefault(require("../middleware/auth"));
const shopController_1 = __importDefault(require("../controllers/shopController"));
const express_validator_1 = require("express-validator");
const axios_1 = __importDefault(require("axios"));
const { getShop, getProductDetails, addProductToCart, removeProductFromCart, increaseProductQuantyInCart, reduceProductQuantyInCart, getAllCartItems, checkOut, addCartItemsToOrder, getCancel, postSuccess, addAddress, } = shopController_1.default;
const router = (0, express_1.Router)();
// type vari = (str: string, Auth: Auth, cont: any) => void;
router.get("/", getShop);
router.route("/details/:productId").get(auth_1.default, getProductDetails);
router.route("/cart").get(auth_1.default, getAllCartItems);
router.route("/add-product-to-cart/:productId").post(auth_1.default, addProductToCart);
router
    .route("/remove-product-from-cart/:cartId")
    .delete(auth_1.default, removeProductFromCart);
router
    .route("/increase-product-qty-in-cart/:cartId")
    .put(auth_1.default, increaseProductQuantyInCart);
router
    .route("/reduce-product-qty-in-cart/:cartId")
    .put(auth_1.default, reduceProductQuantyInCart);
router.route("/checkout").get(auth_1.default, checkOut);
router.route("/add-address").post(auth_1.default, [
    (0, express_validator_1.body)("street", "street name can only me alphabet...").custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("city").custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("state").custom((value, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        return true;
    }),
    (0, express_validator_1.body)("zip", `this is not a valid code`).custom((value, { req }) => {
        if (value.trim().length === 0 ||
            typeof value !== "string" ||
            value === undefined)
            return false;
        if (value === null || value === void 0 ? void 0 : value.includes(","))
            return false;
        if ((value === null || value === void 0 ? void 0 : value.length) !== 6)
            return false;
        return true;
    }),
    (0, express_validator_1.body)("houseNumber").custom((value, { req }) => {
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
    (0, express_validator_1.body)("country").custom((value_1, _a) => __awaiter(void 0, [value_1, _a], void 0, function* (value, { req }) {
        if (!value || typeof value !== "string" || value.trim().length === 0) {
            return Promise.reject("Invalid value: non-string or empty string");
        }
        if (value.includes(",")) {
            return Promise.reject("Invalid value: contains a comma");
        }
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
        return true;
    })),
], addAddress);
router.route("/order").post(auth_1.default, addCartItemsToOrder);
router.route("/order/success/:cartId").post(auth_1.default, postSuccess);
router.route("/order/cancel").get(auth_1.default, getCancel);
exports.default = router;
