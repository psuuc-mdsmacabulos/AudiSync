import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Order from "../dist/order.js";
import authMiddleware from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Get all orders
router.get("/", authMiddleware, async (req, res) => {
    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const orders = await orderRepository.find({ relations: ["item"] }); 
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
            relations: ["items"] 
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

export default router;
