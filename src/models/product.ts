import { Model, Optional, DataTypes } from "sequelize";

import sequelize from "../utils/sequelize";
import CartItems, { CartsItemsType } from "./cartsItems";

export interface ProductAttribute {
  id?: number;
  sellersId: number;
  productImageUri: string;
  productName: string;
  productDescription: string;
  numbersOfProductAvailable: string;
  productPrice: number;
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
  public numbersOfProductAvailable!: string;
  public productPrice!: number;
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { sequelize, modelName: "product" }
);

export default ProductModel;
