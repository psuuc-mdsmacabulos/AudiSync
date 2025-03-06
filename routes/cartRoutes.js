import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Order from "../dist/order.js";
import Cart from "../dist/cart.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Convert Cart to Order
router.post("/checkout", authMiddleware, async (req, res) => {
    const { order_type, customer_name, discount_type, discount_value, payment_method, amount_paid } = req.body;
    const staff_name = req.user.name; 

    try {
        const cartRepository = AppDataSource.getRepository(Cart);
        const orderRepository = AppDataSource.getRepository(Order);

        const cartItems = await cartRepository.find({ where: { staff_name }, relations: ["product"] });

        if (cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        let total_price = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
        let discount_amount = 0;

        if (discount_type === "percentage") {
            discount_amount = (discount_value / 100) * total_price;
        } else if (discount_type === "fixed") {
            discount_amount = discount_value;
        }

        const final_price = total_price - discount_amount;
        const change = amount_paid - final_price;

        // Create an order entry
        const order = orderRepository.create({
            items: cartItems.map(item => item.product), 
            order_type,
            customer_name,
            staff_name,
            discount_type,
            discount_value,
            discount_amount,
            final_price,
            payment_method,
            amount_paid,
            change
        });

        await orderRepository.save(order);

        await cartRepository.delete({ staff_name });

        res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing order" });
    }
});

// Get all orders 
router.get("/", authMiddleware, async (req, res) => {
    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const orders = await orderRepository.find({ relations: ["items"] });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching orders" });
    }
});

export default router;
