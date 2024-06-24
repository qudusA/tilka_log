import { DATE, Transaction } from "sequelize";
import Sequelize, { Model, Optional } from "sequelize";
import sequelize from "../utils/sequelize";
import { OrderItemAttribute } from "./orderItems";
import Delivery, { DeliveryAttribute } from "./delivery";

const { DataTypes } = Sequelize;

export interface OrderType {
  id?: number;
  userId: number;
  orderDate?: Date;
  orderStatus?: string;
  deliveryAddress: number;
  totalAmount: number;
}

interface OrderOptionalAttribute extends Optional<OrderType, "id"> {}

export default class Order
  extends Model<OrderType, OrderOptionalAttribute>
  implements OrderType
{
  public id!: number;
  public userId!: number;
  public orderDate!: Date;
  public orderStatus!:
    | "Processing"
    | "Out for Delivery"
    | "In Transit"
    | "On Hold"
    | "Available for Pickup"
    | "Deliverd";
  public deliveryAddress!: number;
  public totalAmount!: number;

  public createOrderItems!: (
    value: Partial<Array<OrderItemAttribute>>
  ) => Promise<Order>;

  public createDelivery!: (
    delivery: Partial<DeliveryAttribute>,
    Optional: {}
  ) => Promise<Delivery>;

  public createUserModels!: (
    val: Array<OrderType>,
    Optional?: any
  ) => Promise<Array<Delivery>>;
}

Order.init(
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
    deliveryAddress: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(Date.now()),
    },
    orderStatus: {
      type: DataTypes.ENUM(
        "Processing",
        "Out for Delivery",
        "In Transit",
        "On Hold",
        "Available for Pickup",
        "Delivered"
      ),
      allowNull: false,
      defaultValue: "Processing",
      validate: {
        isIn: {
          args: [
            [
              "Processing",
              "Out for Delivery",
              "In Transit",
              "On Hold",
              "Available for Pickup",
              "Delivered",
            ],
          ],
          msg: "input not valid...",
        },
      },
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    modelName: "order",
    sequelize,
    tableName: "order_tbl",
  }
);
