"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ShopController {
    constructor() { }
    getShop(req, res, next) {
        res.status(200).json("welcome home");
    }
}
exports.default = ShopController;
