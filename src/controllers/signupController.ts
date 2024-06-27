import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

import sequelize from "../utils/sequelize";
import GenerateToken from "../utils/generateToken";
import VerifyToken from "../utils/verifyToken";
import InputValidation from "../utils/inputValidation";

import userModel from "../models/userModel";
import tokenModel from "../models/tokenModel";
import Address from "../models/addressModel";
import { SignupEntity } from "../entity/signupEntity";
import { Ok } from "../response/ok/okResponse";
import { ErrorResponse } from "../response/error/ErrorResponse";
import Token from "../models/tokenModel";
import { JwtPayload } from "../entity/JwtPayLoad";
import { Op } from "sequelize";

export class SignUpController {
  private static BASE_URL = process.env.BASE_URL || "http://localhost:3000";
  constructor() {}

  async postSignUp(
    req: Request<{}, {}, SignupEntity, {}>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();

    try {
      const error = validationResult(req);
      const err = new ErrorResponse(
        "invalid data input",
        "error",
        422,
        error.array()
      );

      if (!error.isEmpty()) {
        transaction.rollback();
        return res.status(422).json(err);
      }

      const salt = await bcrypt.genSalt(12);
      const hashPassword = await bcrypt.hash(req.body.password, salt);
      let userName: string = "";
      if (!req.body.userName) {
        const names: string[] = req.body.fullName.split(" ");
        userName =
          names[0][0].toUpperCase() +
          names[1][0].toUpperCase() +
          Math.trunc(Math.random() * 100) +
          1;
      } else {
        userName = req.body.userName;
      }

      const user = await userModel.create(
        {
          email: req.body.email,
          password: hashPassword,
          fullName: req.body.fullName,
          userName: userName,
        },
        { transaction }
      );

      let id, addres;

      const { state, city, zip, country, houseNumber, street } = req.body;

      if (
        state !== undefined &&
        city !== undefined &&
        zip !== undefined &&
        country !== undefined &&
        street !== undefined &&
        houseNumber !== undefined
      ) {
        let address = await user.createAddress(
          {
            city,
            country,
            state,
            street,
            houseNumber,
            zip,
          },
          { transaction }
        );

        ({ id, ...addres } = address.dataValues);
      }

      const { password, ...rest } = user.dataValues;

      const token = uuidv4();

      const redirect = `${SignUpController.BASE_URL}${req.url}/verify?id=${rest.id}&token=${token}`;

      const generateToken = new GenerateToken(token, user);
      await generateToken.saveToken(transaction);

      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const options = {
        from: process.env.GMAIL_EMAIL,
        to: rest.email,
        subject: "ACCOUNT VERIFICATION",
        text: `             NOTIFICATION OF EMAIL VERIFICATION
        kindly click on the following link
        ${redirect}
        to verify your account with us.
        please note that this is a one time token and it expires in 10min.

        kindly ignore the mail if you do not signup on our website..
        `,
      };
      await transport.sendMail(options);

      await transaction.commit();

      res.status(201).json({
        status: "created",
        statusCode: 201,
        message: `user created successfully, kindly check your mail for verification, if you don not get any kindly try to signup with this email ${user.email} in the next 1 hr or use another email `,
        data: { ...rest, ...addres },
      });
    } catch (err) {
      await transaction.rollback();
      next(err);
    }
  }

  async postVerify(
    req: Request<{}, {}, {}, { id: string; token: string }>,
    res: Response,
    next: NextFunction
  ) {
    const transaction = await sequelize.transaction();

    try {
      const { id, token } = req.query;

      const userInstance = await VerifyToken.saveTo(id, token, transaction);

      userInstance.isVerified = true;
      await userInstance.save({ transaction });

      await transaction.commit();

      res.status(201).json({
        status: "updated",
        statusCode: 201,
        message: "user created successfully",
        data: {},
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async postLogin(
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const error = validationResult(req);

    const err = new ErrorResponse(
      "invalid data input",
      "error",
      422,
      error.array()
    );
    if (!error.isEmpty()) return res.status(422).json(err);
    const transaction = await sequelize.transaction();
    try {
      const { email, password } = req.body;

      const foundUser = await userModel.findOne({
        where: { email },
        transaction,
      });

      if (!foundUser)
        throw new ErrorResponse(
          "invalid email or password...",
          "errror",
          404,
          {}
        );

      if (!foundUser.isVerified)
        throw new ErrorResponse(
          "you have not verified yourself...",
          "errror",
          422,
          {}
        );

      const doMatch = await bcrypt.compare(password, foundUser.password);
      if (!doMatch)
        throw new ErrorResponse(
          "invalid email or password....",
          "error",
          404,
          {}
        );

      const userToken = await Token.findAll({
        where: {
          // expirationTime: { [Op.lt]: Date.now() },
          userId: foundUser.id,
          isTokenValid: true,
        },
      });

      if (userToken.length > 1) {
        for (const foundTok of userToken) {
          await foundTok.destroy();
        }
      }

      const refreshJwToken = await jwt.sign(
        {
          email,
          userId: foundUser.id,
          isUserVerified: foundUser.isVerified,
          role: foundUser.role,
        },
        process.env.TOKEN_SECRET!,
        { expiresIn: "1d" }
      );

      await foundUser.createToken(
        {
          token: refreshJwToken,
          expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
        transaction
      );

      const accessJwToken = await jwt.sign(
        {
          email,
          userId: foundUser.id,
          isUserVerified: foundUser.isVerified,
          role: foundUser.role,
        },
        process.env.TOKEN_SECRET!,
        { expiresIn: "15m" }
      );

      await transaction.commit();
      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "login",
        data: { accessJwToken, refreshJwToken },
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async postLogOut(req: Request, res: Response, next: NextFunction) {
    const transaction = await sequelize.transaction();
    try {
      const { refreshJwToken } = req.body;

      const foundToken = await Token.findOne({
        where: { token: refreshJwToken, userId: req.userId },
      });
      if (!foundToken) {
        return res.status(401).json({
          message: "No token found",
          status: "error",
          statusCode: 401,
          data: {},
        });
      }

      await foundToken.destroy();
      transaction.commit();
      res.status(200).json({
        message: "logout successful",
        status: "success",
        statusCode: 200,
        data: {},
      });
    } catch (error) {
      transaction.rollback();
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          message: "No token provided",
          status: "error",
          statusCode: 401,
          data: {},
        });
      }

      const foundToken = await Token.findOne({
        where: {
          token: refreshToken, //userId: req.userId
        },
      });
      if (!foundToken) {
        const error = new ErrorResponse(
          "unAuthorized request",
          "unAuthorized",
          401,
          {}
        );
        return res.status(401).json(error);
      }
      const decoded = (await jwt.verify(
        refreshToken,
        process.env.TOKEN_SECRET!
      )) as JwtPayload;
      if (!decoded) {
        const error = new ErrorResponse(
          "unAuthorized request",
          "unAuthorized",
          401,
          {}
        );
        return res.status(401).json(error);
      }

      const newAccessToken = jwt.sign(
        {
          email: decoded.email,
          userId: decoded.userId,
          isUserVerified: decoded.isUserVerified,
          role: decoded.role,
        },
        process.env.TOKEN_SECRET!,
        { expiresIn: "15m" }
      );

      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      next(error);
    }
  }

  async postForgetPassword(
    req: Request<{}, {}, { email: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { email } = req.body;
    const transaction = await sequelize.transaction();
    const error = validationResult(req);

    const err = new ErrorResponse(
      "invalid data input",
      "error",
      422,
      error.array()
    );

    if (!error.isEmpty()) return res.status(422).json(err);
    try {
      const foundUser = await userModel.findOne({
        where: { email },
        transaction,
      });
      if (!foundUser)
        throw new ErrorResponse("invalid email address...", "error", 404, {});

      if (!foundUser.isVerified)
        throw new ErrorResponse(
          "you have not verified yourself...",
          "errror",
          422,
          {}
        );

      const otp = Math.trunc(Math.random() * 999999 + 100_000);
      const generateToken = new GenerateToken(String(otp), foundUser);
      await generateToken.saveToken(transaction);

      const transport = nodemailer.createTransport({
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
      await transport.sendMail(options);

      const redirect = `${SignUpController.BASE_URL}${req.url}/reset-password/${foundUser.id}`;
      await transaction.commit();

      res.status(201).json({
        status: "created",
        statusCode: 201,
        message: "kindly check you email for a one time otp",
        data: {
          redirect,
        },
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async postPasswordReset(
    req: Request<{ id: string }, {}, { password: string; token: string }>,
    res: Response<Ok | ErrorResponse>,
    next: NextFunction
  ) {
    const { id } = req.params;
    const { password, token } = req.body;
    const transaction = await sequelize.transaction();
    const error = validationResult(req);
    console.log(id, password, token);
    const err = new ErrorResponse(
      "invalid data input",
      "error",
      422,
      error.array()
    );

    if (!error.isEmpty()) return res.status(422).json(err);
    try {
      const userInstance = await VerifyToken.saveTo(id, token, transaction);
      const salt = await bcrypt.genSalt(12);
      const hashPassword = await bcrypt.hash(password, salt);

      userInstance.password = hashPassword;
      await userInstance.save({ transaction });

      await transaction.commit();

      res.status(201).json({
        status: "updated",
        statusCode: 201,
        message: "password reset successful...",
        data: {},
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}
