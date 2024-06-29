import { Router } from "express";
import { query, body } from "express-validator";

import LogisticController from "../controllers/logisticController";
import Auth from "../middleware/auth";

const {
  shearDriverLocation,
  assignDeliveryToDriver,
  // postNonProcessOrders,
  trackDriverLocation,
  postDelivery,
  sendPackage,
  getAllAssingedDelivery,
  getAllPackages,
  getPackageToEdit,
  updateWeight,
} = LogisticController;

const router = Router();

router.route("/driver/current/location").post(
  [
    query("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("invalid cordinate")
      .custom((val) => {
        if (val.length != 9) return false;

        return true;
      }),
    query("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("invalid cordinate")
      .custom((val) => {
        if (val.length != 8) return false;

        return true;
      }),
  ],
  Auth,
  shearDriverLocation
);

router
  .route("/admin/assign-delivery/:driverId")
  .post(Auth, assignDeliveryToDriver);

// router.route("/:driverId").post(Auth, postNonProcessOrders);
router.route("/track-driver-location/:orderId").get(Auth, trackDriverLocation);
router.route("/delivered/:orderId").post(Auth, postDelivery);

router
  .route("/user/package")
  .post(
    Auth,
    [
      body("packageName")
        .isString()
        .withMessage("package name is not optional and can't be a number"),
    ],
    sendPackage
  );
router.route("/admin/package").get(Auth, getAllPackages);
router.route("/driver/delivery").get(Auth, getAllAssingedDelivery);
router.route("/package/edit/:packageId").get(Auth, getPackageToEdit);
router
  .route("/package/update/:packageId")
  .put(
    Auth,
    [
      body("weight")
        .isNumeric()
        .withMessage(
          "weight can't be emplty nor anything other than a number..."
        ),
    ],
    updateWeight
  );

export default router;
