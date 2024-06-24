"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize = new sequelize_1.Sequelize(process.env.POSTGRES_DATABASE_PROD, process.env.POSTGRES_USER_NAME_PROD, process.env.POSTGRES_PASSWORD_PROD, {
    dialect: "postgres",
    port: +process.env.POSTGRES_PORT_PROD,
    host: process.env.POSTGRES_HOST_PROD,
});
exports.default = sequelize;
