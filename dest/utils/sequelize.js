"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize = new sequelize_1.Sequelize(process.env.DB_DATABASE, process.env.DB_USER_NAME, process.env.DB_PASSWORD, { dialect: "mysql" });
exports.default = sequelize;
