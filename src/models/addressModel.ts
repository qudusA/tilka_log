import { DataTypes } from "sequelize";
import { Model, Optional } from "sequelize";
import sequelize from "../utils/sequelize";

export interface AddressType {
  id: number;
  userId: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  houseNumber: string;
  deliveredTo?: boolean;
}

interface AddressOptionalAttribute extends Optional<AddressType, "id"> {}

class Address
  extends Model<AddressType, AddressOptionalAttribute>
  implements AddressType
{
  public id!: number;
  public userId!: number;
  public street!: string;
  public city!: string;
  public state!: string;
  public zip!: string;
  public country!: string;
  public houseNumber!: string;
  public deliveredTo!: boolean;
}

Address.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    houseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deliveredTo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "address",
    tableName: "address_tbl",
    indexes: [
      {
        unique: true,
        fields: ["street", "houseNumber", "city", "userId"],
      },
    ],
  }
);

export default Address;
