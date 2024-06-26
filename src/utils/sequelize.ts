import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.POSTGRES_DATABASE_PROD!,
  process.env.POSTGRES_USER_NAME_PROD!,
  process.env.POSTGRES_PASSWORD_PROD!,
  {
    dialect: "postgres",
    port: +process.env.POSTGRES_PORT_PROD!,
    host: process.env.POSTGRES_HOST_PROD!,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

export default sequelize;
// import { Sequelize } from "sequelize";

// const sequelize = new Sequelize(
//   process.env.POSTGRES_DATABASE!,
//   process.env.POSTGRES_USER_NAME!,
//   process.env.POSTGRES_PASSWORD!,
//   {
//     dialect: "postgres",
//     port: +process.env.POSTGRES_PORT!,
//     host: process.env.POSTGRES_HOST!,
//     // dialectOptions: {
//     //   ssl: {
//     //     require: true,
//     //     rejectUnauthorized: false,
//     //   },
//     // },
//   }
// );

// export default sequelize;
