import { Router } from "express";

import Auth from "../middleware/auth";

import ShopController from "../controllers/shopController";
const shopController = new ShopController();

const router = Router();

// type vari = (str: string, Auth: Auth, cont: any) => void;

router.get("/", Auth, shopController.getShop);

export default router;
