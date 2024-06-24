"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../utils/sequelize"));
class Delivery extends sequelize_1.Model {
}
Delivery.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    orderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    packageId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    latitude: {
        type: sequelize_1.DataTypes.FLOAT,
    },
    longitude: {
        type: sequelize_1.DataTypes.FLOAT,
    },
}, {
    sequelize: sequelize_2.default,
    modelName: "Delivery",
    tableName: "delivery_tbl",
});
exports.default = Delivery;
