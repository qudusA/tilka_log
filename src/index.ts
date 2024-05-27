import express from "express";
import bodyParser, { urlencoded } from "body-parser";
import { Request, Response, NextFunction } from "express-serve-static-core";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import sequelize from "./utils/sequelize";
import shopRouter from "./routes/shopRoute";
import signupRouter from "./routes/signupRoute";
import sellerRouter from "./routes/sellersRouter";
import { ErrorResponse } from "./response/error/ErrorResponse";
import userModel from "./models/userModel";
import tokenModel from "./models/tokenModel";
import productModel from "./models/product";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader("ACCESS-CONTROL-ALLOW-ORIGIN", "*");
  res.setHeader("Access-Control-Allow-Method", "GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Controll-Allow-Header", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + file.originalname);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(multer({ storage, fileFilter }).single("productImageUri"));

app.use(shopRouter);
app.use(signupRouter);
app.use(sellerRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new ErrorResponse("page not found", "error", 404, "");
  next(error);
});

type ErrorHandler = (
  error: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

const errorHandler: ErrorHandler = (error, req, res, next) => {
  const code: number = error.statusCode || 500;
  res.status(code).json({
    status: error.status,
    message: error.message,
  });
};

app.use(errorHandler);

userModel.hasMany(tokenModel, { foreignKey: "userId", onDelete: "CASCADE" });
tokenModel.belongsTo(userModel, { foreignKey: "userId", onDelete: "CASCADE" });

userModel.hasMany(productModel, {
  foreignKey: "sellersId",
  onDelete: "CASCADE",
});
productModel.belongsTo(userModel, {
  foreignKey: "sellersId",
  onDelete: "CASCADE",
});

(async () => {
  const client = await sequelize.sync({ alter: true });
  const PORT = 3000;
  app.listen(PORT, () => console.log(`application running on port:${PORT}`));
})();
