import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.POSTGRES_DATABASE!,
  // "tilkalogistic",
  process.env.POSTGRES_USER_NAME!,
  process.env.POSTGRES_PASSWORD!,
  {
    dialect: "postgres",
    port: 5433,
    host: "127.0.0.1",
    // dialectOptions: {
    //   searchPath: "public", // Set the search path to public
    // },
  }
);

export default sequelize;
// host: "127.0.0.1"
