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
    productStatus: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: "available",
        // defaultValue: function () {
        //   return +this.numbersOfProductAvailable === 0 ? "soldOut" : "available";
        // },
        // set(val) {
        //   if (+this.numbersOfProductAvailable === 0) {
        //     console.log(this.numbersOfProductAvailable, "if");
        //     this.setDataValue("productStatus", "soldOut");
        //   } else {
        //     console.log(this.numbersOfProductAvailable, "else");
        //     this.setDataValue("productStatus", "available");
        //   }
        // },
        validate: {
            isIn: {
                args: [["soldOut", "available"]],
                msg: "Invalid input, must be 'soldOut' or 'available'",
            },
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.default,
    modelName: "product",
    tableName: "product_tbl",
    hooks: {
        // beforeSave: (product: ProductModel, options) => {
        //   if (+product.numbersOfProductAvailable === 0) {
        //     product.productStatus = "soldOut";
        //   } else {
        //     product.productStatus = "available";
        //   }
        // },
        // beforeValidate: (product: ProductModel, options) => {
        //   console.log("Before Save Hook:", product.numbersOfProductAvailable);
        //   if (+product.numbersOfProductAvailable !== 0) {
        //     console.log("else !== 0", product.numbersOfProductAvailable);
        //     product.productStatus = "available";
        //   } else {
        //     console.log("if ===0 ", product.numbersOfProductAvailable);
        //     product.productStatus = "soldOut";
        //   }
        //   console.log("after Save Hook:", product.productStatus);
        // },
        beforeUpdate: (product, options) => {
            console.log("before update", product.numbersOfProductAvailable);
            if (+product.numbersOfProductAvailable !== 0) {
                console.log("else !=0", product.numbersOfProductAvailable);
                product.productStatus = "available";
            }
            else {
                console.log("if === 0", product.numbersOfProductAvailable);
                product.productStatus = "soldOut";
            }
            console.log("after Save Hook:", product.productStatus);
        },
    },
});
exports.default = ProductModel;
