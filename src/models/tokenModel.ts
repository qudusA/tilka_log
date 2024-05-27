import { DataTypes, Optional, Model } from "sequelize";
import sequelize from "../utils/sequelize";

import User from "../models/userModel";

export interface TokenAttributes {
  id: number;
  expirationTime: Date;
  token: string;
  isTokenValid: boolean;
  userId: number;
}

interface TokenOptionalAttribute extends Optional<TokenAttributes, "id"> {}

class Token
  extends Model<TokenAttributes, TokenOptionalAttribute>
  implements TokenAttributes
{
  public id!: number;
  public expirationTime!: Date;
  public token!: string;
  public isTokenValid!: boolean;
  public userId!: number;

  public getUser!: (Optional?: any) => Promise<User>;
}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    expirationTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    isTokenValid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { sequelize, modelName: "token" }
);

export default Token;
