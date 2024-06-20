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
trackDriverLocation, } = logisticController_1.default;
const router = (0, express_1.Router)();
router
    .route("/driver/current/location/:orderId")
    .post([
    (0, express_validator_1.query)("latitude")
        .isFloat({ min: -90, max: 90 })
        .withMessage("invalid cordinate"),
    (0, express_validator_1.query)("longitude")
        .isFloat({ min: -180, max: 180 })
        .withMessage("invalid cordinate"),
], auth_1.default, shearDriverLocation);
router
    .route("/admin/assign-delivery/:orderId")
    .post(auth_1.default, assignDeliveryToDriver);
// router.route("/:driverId").post(Auth, postNonProcessOrders);
router.route("/track-driver-location/:orderId").get(auth_1.default, trackDriverLocation);
exports.default = router;
