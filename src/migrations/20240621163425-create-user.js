"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_tbl", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
        // validate:{}
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false,

        validate: {
          len: {
            args: [10, 200],
            msg: "password must be more that 10 character...",
          },
        },
      },
      role: {
        type: Sequelize.ENUM("user", "admin", "seller", "courier"),
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
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable("user_tbl");
  },
};
