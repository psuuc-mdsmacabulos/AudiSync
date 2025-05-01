import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { getAuditLogs, getAccountLogs } from "../../controllers/admin/auditController.js";

const router = Router();

router.get("/audit", authMiddleware, getAuditLogs);
router.get("/account", authMiddleware, getAccountLogs);

export default router;