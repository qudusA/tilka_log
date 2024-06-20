import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/sequelize";
import CartItems, { CartsItemsType } from "./cartsItems";

export interface CartsType {
  id: number;
  userId: number;
  // createdAt: Date
}

interface CartsTypeOptionalAttribute extends Optional<CartsType, "id"> {}

class Carts
  extends Model<CartsType, CartsTypeOptionalAttribute>
  implements CartsType
{
  public id!: number;
  public userId!: number;
  // public createdAt!: Date;

  public createCartItem!: (
    cartItems: Partial<CartsItemsType>
  ) => Promise<CartItems>;

  public getCartItems!: () => Promise<CartItems[]>;
}

Carts.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { sequelize, modelName: "cart", timestamps: false }
);

export default Carts;
