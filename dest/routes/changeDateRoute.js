"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const changeRole_1 = __importDefault(require("../controllers/changeRole"));
const adminRouterProtect_1 = require("../middleware/adminRouterProtect");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
router.put("/change-user-role", auth_1.default, adminRouterProtect_1.adminRouteProtect, changeRole_1.default.changeRoleByAdmin);
exports.default = router;
