import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
    getOverview,
    getStatistics,
    getProfitsDash,
    getSales,
    getExpenses,
    getOrders,
} from "../../controllers/admin/analyticController.js";

const router = express.Router();

// Routes
router.get("/overview", authMiddleware, getOverview);
router.get("/statistics", authMiddleware, getStatistics);
router.get("/profitsdash", authMiddleware, getProfitsDash);
router.get("/sales", authMiddleware, getSales);
router.get("/expenses", authMiddleware, getExpenses);
router.get("/orders", authMiddleware, getOrders);

export default router;

//