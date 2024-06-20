import { Transaction } from "sequelize";
import tokenModel from "../models/tokenModel";
import { ErrorResponse } from "../response/error/ErrorResponse";

class SaveToken {
  //   private id: number;
  //   private token: string;

  //   constructor(id: number, token: string) {
  //     this.id = id;
  //     this.token = token;
  //   }

  public static async saveTo(
    id: string,
    token: string,
    transaction: Transaction
  ) {
    const tokenInstance = await tokenModel.findOne({
      where: { token, isTokenValid: true, userId: +id },
      transaction,
    });
    if (!tokenInstance) {
      throw new ErrorResponse("invalid token", "error", 404, {});
    }

    if (
      tokenInstance.expirationTime < new Date(Date.now()) ||
      tokenInstance.isTokenValid === false
    ) {
      tokenInstance.isTokenValid = false;
      await tokenInstance.save({ transaction });
      throw new ErrorResponse("expired token", "error", 401, {});
    }

    tokenInstance.isTokenValid = false;
    await tokenInstance.save({ transaction });
    return await tokenInstance.getUser({ transaction });
  }
}

export default SaveToken;
