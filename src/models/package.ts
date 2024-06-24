import sequelize from "../utils/sequelize";
import { DataTypes, Model, Op, Optional } from "sequelize";

export interface PackageAttribute {
  id?: number;
  packageName: string;
  status?: string;
  pickUpDate?: Date;
  senderId?: number;
  receiverId?: number;
  updateCount?: number;
  weight?: string;
  price?: number;
}

export interface PackageOptional extends Optional<PackageAttribute, "id"> {}

export default class Package
  extends Model<PackageAttribute, PackageOptional>
  implements PackageAttribute
{
  public id!: number;
  public packageName!: string;
  public status!: string;
  public pickUpDate!: Date;
  public senderId!: number;
  public receiverId!: number;
  public updateCount!: number;
  public weight!: string;
  public price!: number;
}

Package.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pickUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "Processing",
        "Driver Assiged",
        "In Transit",
        "On Hold",
        "Available for Pickup",
        "Delivered"
      ),
      allowNull: false,
      defaultValue: "Processing",
    },
    updateCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    weight: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "package",
    tableName: "package_tbl",
    hooks: {
      beforeUpdate: function (Package: Package, options) {
        if (Package.updateCount >= 2) {
          throw new Error("can not be updated...");
        }

        Package.updateCount += 1;
        // if (Package.changed("weight")) {
        Package.price = 1000 * +(Package.dataValues.weight as string);
        Package.status = "In Transit";
        // }
      },
    },
  }
);
