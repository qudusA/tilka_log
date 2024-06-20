import { Router } from "express";

import changeRole from "../controllers/changeRole";
import { adminRouteProtect } from "../middleware/adminRouterProtect";
import Auth from "../middleware/auth";

const router = Router();

router.put(
  "/change-user-role",
  Auth,
  adminRouteProtect,
  changeRole.changeRoleByAdmin
);

export default router;
