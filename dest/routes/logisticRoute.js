"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const logisticController_1 = __importDefault(require("../controllers/logisticController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const { shearDriverLocation, assignDeliveryToDriver, 
// postNonProcessOrders,
trackDriverLocation, postDelivery, sendPackage, getAllAssingedDelivery, getAllPackages, getPackageToEdit, updateWeight, } = logisticController_1.default;
const router = (0, express_1.Router)();
router.route("/driver/current/location").post([
    (0, express_validator_1.query)("latitude")
        .isFloat({ min: -90, max: 90 })
        .withMessage("invalid cordinate")
        .custom((val) => {
        if (val.length != 9)
            return false;
        return true;
    }),
    (0, express_validator_1.query)("longitude")
        .isFloat({ min: -180, max: 180 })
        .withMessage("invalid cordinate")
        .custom((val) => {
        if (val.length != 8)
            return false;
        return true;
    }),
], auth_1.default, shearDriverLocation);
router
    .route("/admin/assign-delivery/:driverId")
    .post(auth_1.default, assignDeliveryToDriver);
// router.route("/:driverId").post(Auth, postNonProcessOrders);
router.route("/track-driver-location/:orderId").get(auth_1.default, trackDriverLocation);
router.route("/delivered/:orderId").post(auth_1.default, postDelivery);
router
    .route("/user/package")
    .post(auth_1.default, [
    (0, express_validator_1.body)("packageName")
        .isString()
        .withMessage("package name is not optional and can't be a number"),
], sendPackage);
router.route("/admin/package").get(auth_1.default, getAllPackages);
router.route("/driver/delivery").get(auth_1.default, getAllAssingedDelivery);
router.route("/package/edit/:packageId").get(auth_1.default, getPackageToEdit);
router
    .route("/package/update/:packageId")
    .put(auth_1.default, [
    (0, express_validator_1.body)("weight")
        .isNumeric()
        .withMessage("weight can't be emplty nor anything other than a number..."),
], updateWeight);
exports.default = router;
