"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize = new sequelize_1.Sequelize(process.env.POSTGRES_DATABASE, 
// "tilkalogistic",
process.env.POSTGRES_USER_NAME, process.env.POSTGRES_PASSWORD, {
    dialect: "postgres",
    port: 5433,
    host: "127.0.0.1",
    // dialectOptions: {
    //   searchPath: "public", // Set the search path to public
    // },
});
exports.default = sequelize;
// host: "127.0.0.1"
