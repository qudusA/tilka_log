import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/sequelize";

export interface CartsItemsType {
  id: number;
  productId: number;
  quantity: number;
  productName: string;
  // price?: number;
  cartId: number;
  total?: number;
}

type productType = {
  "product.id": number;
  "product.sellersId": number;
  "product.productImageUri": string;
  "product.categories": string;
  "product.numbersOfProductAvailable": number;
  "product.productDescription": string;
  "product.productName": string;
  "product.productPrice": number;
  "product.createdAt": string;
  "product.updatedAt": string;
  
};
export type combinedType = CartsItemsType & productType;

interface CartsItemsTypeOptional extends Optional<CartsItemsType, "id"> {}

class CartItems
  extends Model<CartsItemsType, CartsItemsTypeOptional>
  implements CartsItemsType
{
  public id!: number;
  public productId!: number;
  public quantity!: number;
  // public price!: number;
  public cartId!: number;
  public productName!: string;
}

CartItems.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    // price: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // total: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     return `${this.dataValues.quantity * this.dataValues.price}`;
    //   },
    // },
  },
  { sequelize, modelName: "cartItems" }
);

export default CartItems;
