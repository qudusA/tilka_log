"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../utils/sequelize"));
class CartItems extends sequelize_1.Model {
}
CartItems.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    productName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    // price: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    cartId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    // total: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     return `${this.dataValues.quantity * this.dataValues.price}`;
    //   },
    // },
}, { sequelize: sequelize_2.default, modelName: "cartItems", tableName: "cart_item_tbl" });
exports.default = CartItems;
