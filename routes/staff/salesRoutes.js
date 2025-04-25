import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
  getOverviewStatistics,
  GetChartStatistics,
  getRevenueData,
  getSalesData,
  getOrdersData,
} from "../../controllers/staff/salesController.js";

const router = express.Router();

router.get("/overview", authMiddleware, getOverviewStatistics);

router.get("/statistics", authMiddleware, GetChartStatistics);

router.get("/profits", authMiddleware, getRevenueData);

router.get("/sales", authMiddleware, getSalesData);

router.get("/orders", authMiddleware, getOrdersData);

export default router;