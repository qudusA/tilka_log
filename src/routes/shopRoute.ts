import { Router } from "express";

import Auth from "../middleware/auth";

import ShopController from "../controllers/shopController";
import { body } from "express-validator";
import axios from "axios";
const {
  getShop,
  getProductDetails,
  addProductToCart,
  removeProductFromCart,
  increaseProductQuantyInCart,
  reduceProductQuantyInCart,
  getAllCartItems,
  checkOut,
  addCartItemsToOrder,
  getCancel,
  postSuccess,
  addAddress,
} = ShopController;

const router = Router();

// type vari = (str: string, Auth: Auth, cont: any) => void;

router.get("/", getShop);
router.route("/details/:productId").get(Auth, getProductDetails);
router.route("/cart").get(Auth, getAllCartItems);
router.route("/add-product-to-cart/:productId").post(Auth, addProductToCart);
router
  .route("/remove-product-from-cart/:cartId")
  .delete(Auth, removeProductFromCart);
router
  .route("/increase-product-qty-in-cart/:cartId")
  .put(Auth, increaseProductQuantyInCart);

router
  .route("/reduce-product-qty-in-cart/:cartId")
  .put(Auth, reduceProductQuantyInCart);

router.route("/checkout").get(Auth, checkOut);
router.route("/add-address").post(
  Auth,
  [
    body("street", "street name can only me alphabet...").custom(
      (value: string, { req }) => {
        if (!value || typeof value !== "string" || value.trim().length === 0)
          return false;
        if (value?.includes(",")) return false;

        return true;
      }
    ),
    body("city").custom((value: string, { req }) => {
      if (!value || typeof value !== "string" || value.trim().length === 0)
        return false;
      if (value?.includes(",")) return false;

      return true;
    }),
    body("state").custom((value: string, { req }) => {
      if (!value || typeof value !== "string" || value.trim().length === 0)
        return false;
      if (value?.includes(",")) return false;

      return true;
    }),
    body("zip", `this is not a valid code`)
      .isPostalCode("any")
      .custom((value: string, { req }) => {
        if (
          value.trim().length === 0 ||
          typeof value !== "string" ||
          value === undefined
        )
          return false;
        if (value?.includes(",")) return false;
        if (value?.length !== 5) return false;

        return true;
      }),
    body("houseNumber").custom((value: string, { req }) => {
      if (
        value.trim().length === 0 ||
        typeof value !== "string" ||
        value === undefined
      )
        return false;
      if (value?.includes(",")) return false;
      if (value?.length > 5) return false;

      return true;
    }),
    body("country").custom(async (value, { req }) => {
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

      const response = await axios.get("https://api.ipify.org?format=json");

      const locationResponse = await axios.get(
        `http://ip-api.com/json/${response.data.ip}`
      );
      if (locationResponse.data.status === "fail") {
        return Promise.reject("something went wrong in your location");
      }

      if (
        restrictedCountries.includes(
          locationResponse.data.country.toUpperCase()
        )
      ) {
        return Promise.reject("Location country is restricted");
      }

      return true;
    }),
  ],
  addAddress
);

router.route("/order").post(Auth, addCartItemsToOrder);
router.route("/order/success/:cartId").post(Auth, postSuccess);
router.route("/order/cancel").get(Auth, getCancel);

export default router;
