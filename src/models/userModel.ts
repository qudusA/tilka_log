import { DataTypes, Model, Optional, Transaction } from "sequelize";
import sequelize from "../utils/sequelize";
import Token, { TokenAttributes } from "./tokenModel";
import ProductModel, { ProductAttribute } from "./product";

interface UserAttributes {
  id: number;
  email: string;
  userName: string;
  fullName: string;
  password: string;
  role?: string;
  isVerified?: boolean;
}

interface UserOptionalAttribute extends Optional<UserAttributes, "id"> {}

export class User
  extends Model<UserAttributes, UserOptionalAttribute>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public userName!: string;
  public fullName!: string;
  public password!: string;
  public role!: string;
  public isVerified!: boolean;

  public createToken!: (
    token: Partial<TokenAttributes>,
    Optional?: any
  ) => Promise<Token>;

  public createProduct!: (
    product: Partial<ProductAttribute>,
    Optional?: any
  ) => Promise<ProductModel>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      // validate:{}
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,

      validate: {
        len: {
          args: [10, 200],
          msg: "password must be more that 10 character...",
        },
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: {
          args: [["user", "admin", "seller", "courier"]],
          msg: "Role must be one of 'user', 'admin', 'seller', or 'courier'.",
        },
      },
    },
    isVerified: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "user",
  }
);

export default User;
