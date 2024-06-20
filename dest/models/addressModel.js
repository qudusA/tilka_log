"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_2 = require("sequelize");
const sequelize_3 = __importDefault(require("../utils/sequelize"));
class Address extends sequelize_2.Model {
}
Address.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    street: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    houseNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    deliveredTo: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    zip: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: sequelize_3.default,
    modelName: "address",
    indexes: [
        {
            unique: true,
            fields: ["street", "houseNumber", "city", "userId"],
        },
    ],
});
exports.default = Address;
