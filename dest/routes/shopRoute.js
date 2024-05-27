"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const shopController_1 = __importDefault(require("../controllers/shopController"));
const shopController = new shopController_1.default();
const router = (0, express_1.Router)();
// type vari = (str: string, Auth: Auth, cont: any) => void;
router.get("/", auth_1.default, shopController.getShop);
exports.default = router;
