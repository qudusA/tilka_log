import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/sequelize";

export interface DeliveryAttribute {
  id?: number;
  orderId?: number;
  driverId: number;
  latitude?: number;
  longitude?: number;
  packageId?: number;
}

interface DeliveryOptional extends Optional<DeliveryAttribute, "id"> {}

class Delivery
  extends Model<DeliveryOptional, DeliveryAttribute>
  implements DeliveryAttribute
{
  public id!: number;
  public orderId?: number;
  public driverId!: number;
  public latitude?: number;
  public longitude?: number;
  public packageId?: number;
}

Delivery.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
    },
    longitude: {
      type: DataTypes.FLOAT,
    },
  },
  {
    sequelize,
    modelName: "Delivery",
    tableName: "delivery_tbl",
  }
);

export default Delivery;
