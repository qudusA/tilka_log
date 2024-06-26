"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const node_cron_1 = __importDefault(require("node-cron"));
const ws_1 = __importDefault(require("ws"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const sequelize_1 = __importDefault(require("./utils/sequelize"));
const shopRoute_1 = __importDefault(require("./routes/shopRoute"));
const signupRoute_1 = __importDefault(require("./routes/signupRoute"));
const sellersRouter_1 = __importDefault(require("./routes/sellersRouter"));
const changeDateRoute_1 = __importDefault(require("./routes/changeDateRoute"));
const logisticRoute_1 = __importDefault(require("./routes/logisticRoute"));
const ErrorResponse_1 = require("./response/error/ErrorResponse");
const userModel_1 = __importDefault(require("./models/userModel"));
const tokenModel_1 = __importDefault(require("./models/tokenModel"));
const product_1 = __importDefault(require("./models/product"));
const addressModel_1 = __importDefault(require("./models/addressModel"));
const cartsModel_1 = __importDefault(require("./models/cartsModel"));
const cartsItems_1 = __importDefault(require("./models/cartsItems"));
const order_1 = __importDefault(require("./models/order"));
const orderItems_1 = __importDefault(require("./models/orderItems"));
const commandLindRunner_1 = __importDefault(require("./utils/commandLindRunner"));
const delivery_1 = __importDefault(require("./models/delivery"));
const package_1 = __importDefault(require("./models/package"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.default.Server({ server });
app.set("trust proxy", 1);
app.use((req, res, next) => {
    res.setHeader("ACCESS-CONTROL-ALLOW-ORIGIN", "*");
    res.setHeader("Access-Control-Allow-Method", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Controll-Allow-Header", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});
const log = fs_1.default.createWriteStream(path_1.default.join(__dirname, "access.log"), {
    flags: "a",
});
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("combined", { stream: log }));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
node_cron_1.default.schedule("0 * * * * ", () => __awaiter(void 0, void 0, void 0, function* () {
    const foundUser = yield userModel_1.default.findAll({
        where: { isVerified: false },
        raw: true,
        include: [
            {
                model: tokenModel_1.default,
                as: "tokens",
            },
        ],
    });
    foundUser.forEach((user) => {
        if (user["tokens.expirationTime"] < new Date(Date.now())) {
            userModel_1.default.destroy({ where: { id: user.id } });
        }
    });
}));
app.use(shopRoute_1.default);
app.use(signupRoute_1.default);
app.use((0, multer_1.default)({ storage }).single("productImageUri"), sellersRouter_1.default);
app.use(changeDateRoute_1.default);
app.use(logisticRoute_1.default);
wss.on("connection", (socket) => {
    socket.on("message", (message) => {
        console.log(`message from the client: ${message} `);
    });
    console.log("socket here", socket);
    socket.send("hello my people this is the server...");
});
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
app.use((req, res, next) => {
    const error = new ErrorResponse_1.ErrorResponse("page not found", "error", 404, "");
    next(error);
});
const errorHandler = (error, req, res, next) => {
    // const transaction = sequelize.transaction();
    const code = error.statusCode || 500;
    res.status(code).json({
        status: error.status,
        message: error.message,
    });
};
app.use(errorHandler);
userModel_1.default.hasMany(tokenModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
tokenModel_1.default.belongsTo(userModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
addressModel_1.default.belongsTo(userModel_1.default, {
    foreignKey: "userId",
    onDelete: "CASCADE",
});
userModel_1.default.hasMany(addressModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
userModel_1.default.hasMany(product_1.default, {
    foreignKey: "sellersId",
    onDelete: "CASCADE",
});
product_1.default.belongsTo(userModel_1.default, {
    foreignKey: "sellersId",
    onDelete: "CASCADE",
});
userModel_1.default.hasOne(cartsModel_1.default, { onDelete: "CASCADE", foreignKey: "userId" });
cartsModel_1.default.belongsTo(userModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
cartsModel_1.default.hasMany(cartsItems_1.default, {
    foreignKey: "cartId",
    onDelete: "CASCADE",
    as: "cartItems",
});
cartsItems_1.default.belongsTo(cartsModel_1.default, { foreignKey: "cartId", onDelete: "CASCADE" });
product_1.default.hasMany(cartsItems_1.default, {
    foreignKey: "productId",
    onDelete: "CASCADE",
    as: "cartItems",
});
cartsItems_1.default.belongsTo(product_1.default, {
    foreignKey: "productId",
    onDelete: "CASCADE",
});
userModel_1.default.hasMany(order_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
order_1.default.belongsTo(userModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
order_1.default.hasMany(orderItems_1.default, { foreignKey: "orderId", onDelete: "CASCADE" });
orderItems_1.default.belongsTo(order_1.default, { foreignKey: "orderId", onDelete: "CASCADE" });
product_1.default.hasMany(orderItems_1.default, {
    foreignKey: "productId",
    onDelete: "CASCADE",
});
orderItems_1.default.belongsTo(product_1.default, {
    foreignKey: "productId",
    onDelete: "CASCADE",
});
userModel_1.default.hasMany(delivery_1.default, { foreignKey: "driverId" });
delivery_1.default.belongsTo(userModel_1.default, { foreignKey: "driverId" });
order_1.default.hasOne(delivery_1.default, { foreignKey: "orderId", onDelete: "CASCADE" });
delivery_1.default.belongsTo(order_1.default, { foreignKey: "orderId", onDelete: "CASCADE" });
package_1.default.hasOne(delivery_1.default, { foreignKey: "packageId", onDelete: "CASCADE" });
delivery_1.default.belongsTo(package_1.default, { foreignKey: "packageId", onDelete: "CASCADE" });
package_1.default.belongsTo(userModel_1.default, {
    as: "Sender",
    foreignKey: "senderId",
    onDelete: "CASCADE",
});
package_1.default.belongsTo(userModel_1.default, {
    as: "Receiver",
    foreignKey: "receiverId",
    onDelete: "CASCADE",
});
userModel_1.default.hasMany(package_1.default, {
    as: "SentPackages",
    foreignKey: "senderId",
    onDelete: "CASCADE",
});
userModel_1.default.hasMany(package_1.default, {
    as: "ReceivedPackages",
    foreignKey: "receiverId",
    onDelete: "CASCADE",
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield sequelize_1.default.sync();
    yield commandLindRunner_1.default.createSuperAdmin();
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`application running on port:${PORT}`));
}))();
