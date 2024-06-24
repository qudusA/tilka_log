import fs from "fs";
import path from "path";
import http from "http";

import express from "express";
import bodyParser, { urlencoded } from "body-parser";
import { Request, Response, NextFunction } from "express-serve-static-core";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cron from "node-cron";
import WebSocket from "ws";

// import { Server } from "socket.io";

import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import axios from "axios";

// import { capturePayment, createOrder } from "./utils/paypal";

import sequelize from "./utils/sequelize";
import shopRouter from "./routes/shopRoute";
import signupRouter from "./routes/signupRoute";
import sellerRouter from "./routes/sellersRouter";
import changeDataRoute from "./routes/changeDateRoute";
import logisticRouter from "./routes/logisticRoute";

import { ErrorResponse } from "./response/error/ErrorResponse";
import userModel, { UserAttributes } from "./models/userModel";
import tokenModel, { TokenAttributes } from "./models/tokenModel";
import productModel from "./models/product";
import addressModel from "./models/addressModel";
import cartsModel from "./models/cartsModel";
import cartsItems from "./models/cartsItems";
import Order, { OrderType } from "./models/order";
import OrderItem, { OrderItemAttribute } from "./models/orderItems";

import CommandLineRunner from "./utils/commandLindRunner";
import Delivery from "./models/delivery";
import Auth from "./middleware/auth";
import Package from "./models/package";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// const io = new Server(httpServer, {
//   cors: {
//     origin: "http://127.0.0.1:5500",
//   },
// });

app.use((req, res, next) => {
  res.setHeader("ACCESS-CONTROL-ALLOW-ORIGIN", "*");
  res.setHeader("Access-Control-Allow-Method", "GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Controll-Allow-Header", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
// app.use(express.static("public"));

const log = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression());
app.use(helmet());

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "https://cdn.socket.io"],
//       // add other CSP directives as needed
//     },
//   })
// );

app.use(morgan("combined", { stream: log }));

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

type toke = {
  "tokens.id": number;
  "tokens.expirationTime": Date;
  "tokens.token": string;
  "tokens.isTokenValid": boolean;
  "tokens.userId": number;
  "tokens.createdAt": Date;
  "tokens.updatedAt": Date;
};

type comb = UserAttributes & toke;

cron.schedule("0 * * * * ", async () => {
  const foundUser: any = await userModel.findAll({
    where: { isVerified: false },
    raw: true,
    include: [
      {
        model: tokenModel,
        as: "tokens",
      },
    ],
  });
  foundUser.forEach((user: comb) => {
    if (user["tokens.expirationTime"] < new Date(Date.now())) {
      userModel.destroy({ where: { id: user.id } });
    }
  });
});

app.use(shopRouter);
app.use(signupRouter);
app.use(sellerRouter);
app.use(changeDataRoute);
app.use(logisticRouter);

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    console.log(`message from the client: ${message} `);
  });
  console.log("socket here", socket);
  socket.send("hello my people this is the server...");
});

// io.on("connection", (socket) => {
//   console.log("A user connected with id:", socket.id);

// socket.on("register", async (userId: string, role: "buyer" | "driver") => {
//   console.log(
//     `User ${userId} registered as ${role} with socket id: ${socket.id}`
//   );

//   // Check if user already exists
//   let user = await User.findOne({ where: { userId } });

//   if (user) {
//     // Update existing user
//     await user.update({ socketId: socket.id });
//   } else {
//     // Create new user
//     await User.create({ userId, name: userId, role, socketId: socket.id });
//   }
// });

// socket.on(
//   "locationUpdate",
//   async (data: { driverId: string; lat: number; lon: number }) => {
//     const driverId = data.driverId;
//     const deliveries = await Delivery.findAll({ where: { driverId } });

//     for (const delivery of deliveries) {
//       const order = await Order.findOne({
//         where: { orderId: delivery.orderId },
//       });
//       const buyer = await User.findOne({ where: { userId: order.buyerId } });

//       if (buyer && buyer.socketId) {
//         io.to(buyer.socketId).emit("driverLocation", {
//           orderId: delivery.orderId,
//           lat: data.lat,
//           lon: data.lon,
//         });
//       }
//     }
//   }
// );

// socket.on("trackOrder", async (orderId: string, buyerId: string) => {
//   const order = await Order.findOne({ where: { orderId, buyerId } });
//   if (order) {
//     const delivery = await Delivery.findOne({ where: { orderId } });
//     if (delivery) {
//       const driver = await User.findOne({
//         where: { userId: delivery.driverId },
//       });
//       if (driver && driver.socketId) {
//         io.to(driver.socketId).emit("startTracking", orderId);
//       }
//     }
//   }
// });

// socket.on("disconnect", async () => {
//   console.log("User disconnected:", socket.id);
//   await User.update({ socketId: null }, { where: { socketId: socket.id } });
// });
// });

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
  // const transaction = sequelize.transaction();

  const code: number = error.statusCode || 500;
  res.status(code).json({
    status: error.status,
    message: error.message,
  });
};

app.use(errorHandler);

userModel.hasMany(tokenModel, { foreignKey: "userId", onDelete: "CASCADE" });
tokenModel.belongsTo(userModel, { foreignKey: "userId", onDelete: "CASCADE" });

addressModel.belongsTo(userModel, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
userModel.hasMany(addressModel, { foreignKey: "userId", onDelete: "CASCADE" });

userModel.hasMany(productModel, {
  foreignKey: "sellersId",
  onDelete: "CASCADE",
});
productModel.belongsTo(userModel, {
  foreignKey: "sellersId",
  onDelete: "CASCADE",
});

userModel.hasOne(cartsModel, { onDelete: "CASCADE", foreignKey: "userId" });
cartsModel.belongsTo(userModel, { foreignKey: "userId", onDelete: "CASCADE" });

cartsModel.hasMany(cartsItems, {
  foreignKey: "cartId",
  onDelete: "CASCADE",
  as: "cartItems",
});
cartsItems.belongsTo(cartsModel, { foreignKey: "cartId", onDelete: "CASCADE" });

productModel.hasMany(cartsItems, {
  foreignKey: "productId",
  onDelete: "CASCADE",
  as: "cartItems",
});
cartsItems.belongsTo(productModel, {
  foreignKey: "productId",
  onDelete: "CASCADE",
});

userModel.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(userModel, { foreignKey: "userId", onDelete: "CASCADE" });

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", onDelete: "CASCADE" });

productModel.hasMany(OrderItem, {
  foreignKey: "productId",
  onDelete: "CASCADE",
});
OrderItem.belongsTo(productModel, {
  foreignKey: "productId",
  onDelete: "CASCADE",
});

userModel.hasMany(Delivery, { foreignKey: "driverId" });
Delivery.belongsTo(userModel, { foreignKey: "driverId" });

Order.hasOne(Delivery, { foreignKey: "orderId", onDelete: "CASCADE" });
Delivery.belongsTo(Order, { foreignKey: "orderId", onDelete: "CASCADE" });

Package.hasOne(Delivery, { foreignKey: "packageId", onDelete: "CASCADE" });
Delivery.belongsTo(Package, { foreignKey: "packageId", onDelete: "CASCADE" });

Package.belongsTo(userModel, {
  as: "Sender",
  foreignKey: "senderId",
  onDelete: "CASCADE",
});
Package.belongsTo(userModel, {
  as: "Receiver",
  foreignKey: "receiverId",
  onDelete: "CASCADE",
});

userModel.hasMany(Package, {
  as: "SentPackages",
  foreignKey: "senderId",
  onDelete: "CASCADE",
});
userModel.hasMany(Package, {
  as: "ReceivedPackages",
  foreignKey: "receiverId",
  onDelete: "CASCADE",
});

(async () => {
  const client = await sequelize.sync();
  await CommandLineRunner.createSuperAdmin();

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`application running on port:${PORT}`));
})();
