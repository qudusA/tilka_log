import Sequelize, { Model, Optional } from "sequelize";
import sequelize from "../utils/sequelize";

const { DataTypes } = Sequelize;

export interface OrderItemAttribute {
  id?: number;
  orderId?: number;
  productId?: number;
  unitPrice: number;
  priceOfQuantity?: number;
  quantity: number;
}

interface OrderItemOptional extends Optional<OrderItemAttribute, "id"> {}

export default class OrderItem
  extends Model<OrderItemAttribute, OrderItemOptional>
  implements OrderItemAttribute
{
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public unitPrice!: number;
  public priceOfQuantity!: number;
  public quantity!: number;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    unitPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priceOfQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      set(val) {
        const pQty = this.dataValues.unitPrice * this.dataValues.quantity;
        this.setDataValue("priceOfQuantity", pQty);
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "orderItems",
    hooks: {
      beforeCreate: (orderitems: OrderItem) => {
        orderitems.priceOfQuantity = orderitems.quantity * orderitems.unitPrice;
      },
    },
  }
);
