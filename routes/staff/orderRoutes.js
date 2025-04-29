import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
    getAllOrders,
    getCancelledOrders,
    getReadyOrders,
    getKitchenOrders,
    getOrderById,
    updateOrderStatus,
} from "../../controllers/staff/orderController.js";

const router = express.Router();

router.get("/", authMiddleware, getAllOrders);

router.get("/cancelled/", authMiddleware, getCancelledOrders);

router.get("/ready/", authMiddleware, getReadyOrders);

router.get("/kitchen/", authMiddleware, getKitchenOrders);

router.get("/:id", authMiddleware, getOrderById);

router.patch("/:id/status", authMiddleware, updateOrderStatus);

export default router;

//