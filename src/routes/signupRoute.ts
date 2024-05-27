import { Router } from "express";
import { body, check } from "express-validator";
import userModel from "../models/userModel";
import { ErrorResponse } from "../response/error/ErrorResponse";

import { SignUpController } from "../controllers/signupController";

const {
  postSignUp,
  postVerify,
  postLogin,
  postForgetPassword,
  postPasswordReset,
} = new SignUpController();

const router = Router();

router.post(
  "/signup",
  [
    body("email", "this is not a valid email address...")
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .trim()
      .custom(async (value: string, { req }) => {
        if (!/^[\w.-]+@gmail\.com$/.test(value)) {
          throw new Error("Email must end with gmail.com");
          // return false;
        }
        const userInstance = await userModel.findOne({
          where: { email: value },
        });
        if (userInstance) return Promise.reject("user already exist");

        return true;
      }),
    body(
      "userName",
      "user name must be more than 3 character or leave it for it and it will be generated for you..."
    ).custom((value: string) => {
      if (value.length >= 1 && value.length <= 2) return false;

      return true;
    }),
    body(
      "fullName",
      "full name must contain surnname and first name and they must be more than three letters each..."
    )
      .notEmpty()
      .rtrim()
      .ltrim()
      .custom((value) => {
        const splitName: string[] = value.split(" ");
        if (splitName.length === 1) return false;
        if (splitName[0].length < 3 || splitName[1].length < 3) return false;

        return true;
      }),
    body(
      "password",
      "Password must contain at least one uppercase letter, one lowercase letter, and one number."
    )
      .notEmpty()
      .trim()
      .custom((value) => {
        if (!value) throw new Error("password is required...");

        const partter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
        const matchParttern = partter.test(value);
        if (!matchParttern) return false;
        return true;
      }),
    body("confirmPassword", "password doesn't match...")
      .notEmpty()
      .custom((value, { req }) => {
        if (value !== req.body.password) return false;
        return true;
      }),
    body("role").custom((value: string, { req }) => {
      console.log("role", value);
      if (value) {
        if (!["user", "seller", "courier"].includes(value))
          throw new Error(
            "you can only signup as a user, seller or courier..."
          );
      }
      return true;
    }),
  ],
  postSignUp
);

router.post("/signup/verify/", postVerify);

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("email is required...")
      .isEmail()
      .withMessage(" invalid input data")
      .normalizeEmail()
      .trim(),
    body("password")
      .trim()
      .custom((value, { req }) => {
        if (!value) throw new Error("password is required...");
        const partter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
        const matchParttern = partter.test(value);
        if (!matchParttern) return false;
        return true;
      }),
  ],
  postLogin
);

router.post(
  "/forgetpassword",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("this is not a valid email...")
      .custom(async (value: string, { req }) => {
        if (!/^[\w.-]+@gmail\.com$/.test(value)) {
          throw new Error("Email must end with gmail.com");
          // return false;
        }

        return true;
      }),
  ],
  postForgetPassword
);

router.post(
  "/forgetpassword/reset-password/:id",
  [
    body("password")
      .trim()
      .custom((value, { req }) => {
        if (!value) throw new Error("password is required...");
        const partter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
        const matchParttern = partter.test(value);
        if (!matchParttern) return false;
        return true;
      }),
    body("token").isNumeric().withMessage("invalid otp"),
  ],
  postPasswordReset
);

export default router;
