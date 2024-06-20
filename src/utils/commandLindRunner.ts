import userModel from "../models/userModel";
import bcrypt from "bcrypt";

class CommandLineRunner {
  static async createSuperAdmin() {
    const superAdmin = await userModel.findOne({
      where: { email: "superAdmin@gmail.com" },
    });
    if (superAdmin) {
      console.log("super admin already exist...");
    } else {
      const hashPassword = await bcrypt.hash("superAdmin1", 12);

      const superA = await userModel.create({
        email: "superAdmin@gmail.com",
        fullName: "super admin",
        password: hashPassword,
        isVerified: true,
        role: "admin",
        userName: "SA1",
      });
    }
  }
}

export default CommandLineRunner;
