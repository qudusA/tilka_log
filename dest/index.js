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
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const sequelize_1 = __importDefault(require("./utils/sequelize"));
const shopRoute_1 = __importDefault(require("./routes/shopRoute"));
const signupRoute_1 = __importDefault(require("./routes/signupRoute"));
const sellersRouter_1 = __importDefault(require("./routes/sellersRouter"));
const ErrorResponse_1 = require("./response/error/ErrorResponse");
const userModel_1 = __importDefault(require("./models/userModel"));
const tokenModel_1 = __importDefault(require("./models/tokenModel"));
const product_1 = __importDefault(require("./models/product"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((req, res, next) => {
    res.setHeader("ACCESS-CONTROL-ALLOW-ORIGIN", "*");
    res.setHeader("Access-Control-Allow-Method", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Controll-Allow-Header", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, (0, uuid_1.v4)() + file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
app.use((0, multer_1.default)({ storage, fileFilter }).single("productImageUri"));
app.use(shopRoute_1.default);
app.use(signupRoute_1.default);
app.use(sellersRouter_1.default);
app.use((req, res, next) => {
    const error = new ErrorResponse_1.ErrorResponse("page not found", "error", 404, "");
    next(error);
});
const errorHandler = (error, req, res, next) => {
    const code = error.statusCode || 500;
    res.status(code).json({
        status: error.status,
        message: error.message,
    });
};
app.use(errorHandler);
userModel_1.default.hasMany(tokenModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
tokenModel_1.default.belongsTo(userModel_1.default, { foreignKey: "userId", onDelete: "CASCADE" });
userModel_1.default.hasMany(product_1.default, {
    foreignKey: "sellersId",
    onDelete: "CASCADE",
});
product_1.default.belongsTo(userModel_1.default, {
    foreignKey: "sellersId",
    onDelete: "CASCADE",
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield sequelize_1.default.sync({ alter: true });
    const PORT = 3000;
    app.listen(PORT, () => console.log(`application running on port:${PORT}`));
}))();
