import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_DATABASE!,
  process.env.DB_USER_NAME!,
  process.env.DB_PASSWORD!,
  { dialect: "mysql" }
);

export default sequelize;
