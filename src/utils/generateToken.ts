import { Transaction } from "sequelize";
import { User } from "../models/userModel";

class GenerateToken {
  private expirationTime: Date = new Date(Date.now() + 1000 * 60 * 10);
  private token: string;
  private instance: User;

  constructor(token: string, instance: User) {
    this.token = token;
    this.instance = instance;
  }

  public async saveToken(transaction: Transaction) {
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
