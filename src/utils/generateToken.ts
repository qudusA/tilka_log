import { Transaction } from "sequelize";
import { User } from "../models/userModel";

class GenerateToken {
  private expirationTime: Date = new Date(Date.now() + 1000 * 60 * 10);
  private token: string;
  private instance: User;

  constructor(token: string, instance: User) {
    this.token = token;
    this.instance = instance;
    console.log("we got to the constructor...");
  }

  public async saveToken(transaction: Transaction) {
    console.log("we saved here as well");
    return await this.instance.createToken(
      {
        token: this.token,
        expirationTime: this.expirationTime,
      },
      { transaction }
    );
  }
}

export default GenerateToken;
