import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Order from "../dist/order.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all orders 
router.get("/", authMiddleware, async (req, res) => {
    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const orders = await orderRepository.find({ relations: ["orderItems"] });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// Get a single order by ID
router.get("/:id", authMiddleware, async (req, res) => {
    const orderId = req.params.id;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({
            where: { id: orderId },
            relations: ["orderItems", "orderItems.product"], // Fetch the product data along with the order items
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching order" });
    }
});


router.patch("/:id/status", authMiddleware, async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        await orderRepository.update(orderId, { status });

        res.json({ message: "Order status updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating order status" });
    }
});

export default router;
