import { JwtPayload } from "../entity/JwtPayLoad";

import {
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from "express-serve-static-core";
import { ErrorResponse } from "../response/error/ErrorResponse";
import jsonwebtoken from "jsonwebtoken";

// class Auth {
const Auth: RequestHandler = (
  req: Request,
  res: Response<ErrorResponse>,
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
// }

export default Auth;
