import { JwtPayload } from "../entity/JwtPayLoad";
import User from "../models/userModel";

import {
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from "express-serve-static-core";
import { ErrorResponse } from "../response/error/ErrorResponse";
import jsonwebtoken from "jsonwebtoken";
import Token from "../models/tokenModel";
import { Ok } from "../response/ok/okResponse";

// class Auth {
const Auth: RequestHandler = async (
  req: Request,
  res: Response<ErrorResponse | Ok>,
  next: NextFunction
) => {
  try {
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      const error = new ErrorResponse(
        "unAuthorized request",
        "unAuthorized not logged in",
        401,
        {}
      );
      return res.status(401).json(error);
    }

    const jwt = authHeader.startsWith("Bearer ");
    if (!jwt) {
      const error = new ErrorResponse(
        "unAuthorized request",
        " unAuthorized not logged in",
        401,
        {}
      );
      return res.status(401).json(error);
    }
    const jwToken = authHeader.split(" ")[1];
    if (jwToken === " " || jwToken === null) {
      const error = new ErrorResponse(
        "unAuthorized request",
        "unAuthorized",
        401,
        {}
      );
      return res.status(401).json(error);
    }

    const decode = jsonwebtoken.verify(
      jwToken,
      process.env.TOKEN_SECRET!
    ) as JwtPayload;

    if (!decode) {
      const error = new ErrorResponse(
        "unAuthorized request",
        "unAuthorized",
        401,
        {}
      );
      return res.status(401).json(error);
    }

    const foundUser: any = await User.findOne({
      where: { id: decode.userId },

      raw: true,
      include: [{ model: Token, as: "tokens" }],
      order: [[{ model: Token, as: "tokens" }, "id", "DESC"]],
    });

    if (!foundUser) {
      return res.status(401).json({
        message: "logged out already",
        status: "unAuthorized",
        statusCode: 401,
        data: {},
      });
    }

    if (!foundUser["tokens.isTokenValid"]) {
      return res.status(401).json({
        message: "logged out already",
        status: "unAuthorized",
        statusCode: 401,
        data: {},
      });
    }

    req.userId = decode.userId;
    req.email = decode.email;
    req.isUserVerified = decode.isUserVerified;
    req.role = decode.role;
    req.isAuth = true;

    next();
  } catch (error) {
    next(error);
  }
};

export default Auth;
