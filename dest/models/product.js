"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../utils/sequelize"));
class ProductModel extends sequelize_1.Model {
}
ProductModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sellersId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    productImageUri: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    categories: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    numbersOfProductAvailable: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    productDescription: {
        type: sequelize_1.DataTypes.STRING(1000),
        allowNull: false,
    },
    productName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    productPrice: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, { sequelize: sequelize_2.default, modelName: "product" });
exports.default = ProductModel;
