import { Router } from "express";

import SellersController from "../controllers/sellersController";
import Auth from "../middleware/auth";

const router = Router();

router.post("/add-product", Auth, SellersController.postProduct);


export default router;