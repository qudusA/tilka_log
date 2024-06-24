"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("../utils/sequelize"));
const sequelize_2 = require("sequelize");
class Package extends sequelize_2.Model {
}
exports.default = Package;
Package.init({
    id: {
        type: sequelize_2.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    senderId: {
        type: sequelize_2.DataTypes.INTEGER,
        allowNull: false,
    },
    receiverId: {
        type: sequelize_2.DataTypes.INTEGER,
        allowNull: false,
    },
    packageName: {
        type: sequelize_2.DataTypes.STRING,
        allowNull: false,
    },
    pickUpDate: {
        type: sequelize_2.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_2.DataTypes.ENUM("Processing", "Driver Assiged", "In Transit", "On Hold", "Available for Pickup", "Delivered"),
        allowNull: false,
        defaultValue: "Processing",
    },
    updateCount: {
        type: sequelize_2.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    weight: {
        type: sequelize_2.DataTypes.STRING,
        allowNull: true,
    },
    price: {
        type: sequelize_2.DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize: sequelize_1.default,
    modelName: "package",
    tableName: "package_tbl",
    hooks: {
        beforeUpdate: function (Package, options) {
            if (Package.updateCount >= 2) {
                throw new Error("can not be updated...");
            }
            Package.updateCount += 1;
            // if (Package.changed("weight")) {
            Package.price = 1000 * +Package.dataValues.weight;
            Package.status = "In Transit";
            // }
        },
    },
});
