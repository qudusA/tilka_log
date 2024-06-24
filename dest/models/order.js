"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importStar(require("sequelize"));
const sequelize_2 = __importDefault(require("../utils/sequelize"));
const { DataTypes } = sequelize_1.default;
class Order extends sequelize_1.Model {
}
exports.default = Order;
Order.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    deliveryAddress: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date(Date.now()),
    },
    orderStatus: {
        type: DataTypes.ENUM("Processing", "Out for Delivery", "In Transit", "On Hold", "Available for Pickup", "Delivered"),
        allowNull: false,
        defaultValue: "Processing",
        validate: {
            isIn: {
                args: [
                    [
                        "Processing",
                        "Out for Delivery",
                        "In Transit",
                        "On Hold",
                        "Available for Pickup",
                        "Delivered",
                    ],
                ],
                msg: "input not valid...",
            },
        },
    },
    totalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    modelName: "order",
    sequelize: sequelize_2.default,
    tableName: "order_tbl",
});
