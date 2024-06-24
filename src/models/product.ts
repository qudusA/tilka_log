import { Model, Optional, DataTypes } from "sequelize";

import sequelize from "../utils/sequelize";
import CartItems, { CartsItemsType } from "./cartsItems";

export interface ProductAttribute {
  id?: number;
  sellersId: number;
  productImageUri: string;
  productName: string;
  productDescription: string;
  numbersOfProductAvailable: number;
  productPrice: number;
  productStatus?: string;
  categories: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductOptionalAttribute extends Optional<ProductAttribute, "id"> {}

class ProductModel
  extends Model<ProductAttribute, ProductOptionalAttribute>
  implements ProductAttribute
{
  public id!: number;
  public sellersId!: number;
  public productImageUri!: string;
  public productName!: string;
  public productDescription!: string;
  public numbersOfProductAvailable!: number;
  public productPrice!: number;
  public productStatus?: string;
  public categories!: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  public createCartItems!: (
    cartItems: Partial<CartsItemsType>
  ) => Promise<CartItems>;
}

ProductModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    sellersId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productImageUri: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categories: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numbersOfProductAvailable: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productDescription: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productStatus: {
      type: DataTypes.STRING,
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
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },

  {
    sequelize,
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
      beforeUpdate: (product: ProductModel, options) => {
        console.log("before update", product.numbersOfProductAvailable);
        if (+product.numbersOfProductAvailable !== 0) {
          console.log("else !=0", product.numbersOfProductAvailable);
          product.productStatus = "available";
        } else {
          console.log("if === 0", product.numbersOfProductAvailable);
          product.productStatus = "soldOut";
        }
        console.log("after Save Hook:", product.productStatus);
      },
    },
  }
);

export default ProductModel;
