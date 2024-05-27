import { Request, Response, NextFunction } from "express-serve-static-core";

export default class ShopController {
  constructor() {}

  getShop(req: Request, res: Response, next: NextFunction) {
    res.status(200).json("welcome home");
  }
}
