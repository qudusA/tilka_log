"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // const hashPassword = await bcrypt.hash("superAdmin1", 12);

    return queryInterface.bulkInsert("user_tbl", [
      {
        email: "test1@gmail.com",
        fullName: "test 1",
        password: "superAdmin1",
        isVerified: true,
        role: "user",
        userName: "ts1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "test2@gmail.com",
        fullName: "test 2",
        password: "superAdmin1",
        isVerified: true,
        role: "user",
        userName: "ts2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "test3@gmail.com",
        fullName: "test 3",
        password: "superAdmin1",
        isVerified: true,
        role: "user",
        userName: "ts3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "test4@gmail.com",
        fullName: "test 4",
        password: "superAdmin1",
        isVerified: true,
        role: "user",
        userName: "ts4",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
