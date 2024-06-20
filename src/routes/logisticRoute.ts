import { Router } from "express";
import { query } from "express-validator";

import LogisticController from "../controllers/logisticController";
import Auth from "../middleware/auth";

const {
  shearDriverLocation,
  assignDeliveryToDriver,
  // postNonProcessOrders,
  trackDriverLocation,
} = LogisticController;

const router = Router();

router
  .route("/driver/current/location/:orderId")
  .post(
    [
      query("latitude")
        .isFloat({ min: -90, max: 90 })
        .withMessage("invalid cordinate"),
      query("longitude")
        .isFloat({ min: -180, max: 180 })
        .withMessage("invalid cordinate"),
    ],
    Auth,
    shearDriverLocation
  );

router
  .route("/admin/assign-delivery/:orderId")
  .post(Auth, assignDeliveryToDriver);

// router.route("/:driverId").post(Auth, postNonProcessOrders);
router.route("/track-driver-location/:orderId").get(Auth, trackDriverLocation);

export default router;