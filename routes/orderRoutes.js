import express from "express";
import { AppDataSource } from "../config/data-source";
import Order from "../dist/order.js";
import Product from "../dist/products.js";

const router = express.Router();

// Create a new order
router.post("/", async (req, res) => {
    const {
        productId, order_type, customer_name, discount_type,
        discount_value, payment_method, amount_paid
    } = req.body;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const orderRepository = AppDataSource.getRepository(Order);

        const product = await productRepository.findOne({ where: { id: productId } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let discount_amount = 0;
        let final_price = product.price;

        // Compute discount
        if (discount_type === "percentage") {
            discount_amount = (discount_value / 100) * product.price;
        } else if (discount_type === "fixed") {
            discount_amount = discount_value;
        }

        final_price -= discount_amount;
        const change = amount_paid - final_price;

        const order = orderRepository.create({
            item: product,
            order_type,
            customer_name,
            discount_type,
            discount_value,
            discount_amount,
            final_price,
            payment_method,
            amount_paid,
            change
        });

        await orderRepository.save(order);
        res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating order" });
    }
});

// Get all orders
router.get("/", async (req, res) => {
    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const orders = await orderRepository.find({ relations: ["item"] });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching orders" });
    }
});

export default router;
