import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source.js";
import Sale from "../dist/sale.js";
import User from "../dist/user.js";

dotenv.config();

const router = express.Router();

// Extract user info from token
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Retrieve full name of the staff from User entity
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        
        req.user.fullName = `${user.first_name} ${user.last_name}`;

        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

// Calculate discount
const calculateDiscount = (total_price, discount_type, discount_value) => {
    let discount_amount = 0;

    if (discount_type === "Fixed") {
        discount_amount = discount_value;
    } else if (discount_type === "Percentage") {
        discount_amount = (discount_value / 100) * total_price;
    }

    // Final price doesn't go below zero
    const final_price = Math.max(0, total_price - discount_amount);

    return { discount_amount, final_price };
};

// Get all sales (orders)
router.get("/", async (req, res) => {
    try {
        const saleRepository = AppDataSource.getRepository(Sale);
        const sales = await saleRepository.find({ order: { created_at: "DESC" } });
        res.json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching sales records" });
    }
});

// Get sales by order number
router.get("/:order_number", async (req, res) => {
    const { order_number } = req.params;
    try {
        const saleRepository = AppDataSource.getRepository(Sale);
        const sale = await saleRepository.findOne({ where: { order_number: order_number } });
        if (!sale) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(sale);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching order details" });
    }
});

// Create a new sale (order)
router.post("/", authenticate, async (req, res) => {
    const { order_number, item, quantity, price, total_price, payment_method, status, discount_type, discount_value, order_type } = req.body;
    const staff_name = req.user.fullName;

    try {
        // Order type validation
        if (!['Dine-in', 'Take-out'].includes(order_type)) {
            return res.status(400).json({ message: "Invalid order type. Must be 'Dine-in' or 'Take-out'" });
        }

        // Discount function
        const { discount_amount, final_price } = calculateDiscount(total_price, discount_type, discount_value);

        const saleRepository = AppDataSource.getRepository(Sale);
        const sale = new Sale();
        sale.order_number = order_number; 
        sale.item = item;
        sale.quantity = quantity;
        sale.price = price;
        sale.total_price = total_price;
        sale.discount_type = discount_type;
        sale.discount_value = discount_value;
        sale.discount_amount = discount_amount;
        sale.final_price = final_price;
        sale.payment_method = payment_method;
        sale.status = status;
        sale.staff_name = staff_name;
        sale.order_type = order_type;

        await saleRepository.save(sale);

        res.status(201).json(sale);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating sales order" });
    }
});

// Update order status (Order number)
router.put("/:order_number", async (req, res) => {
    const { order_id } = req.params;
    const { status } = req.body;

    try {
        const saleRepository = AppDataSource.getRepository(Sale);
        const sale = await saleRepository.findOne({ where: { order_id: order_id } });

        if (!sale) {
            return res.status(404).json({ message: "Order not found" });
        }

        sale.status = status;
        await saleRepository.save(sale);

        res.json({ message: "Order updated successfully", order: sale });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating order status" });
    }
});

// Delete a sale (order number)
router.delete("/:order_number", async (req, res) => {
    const { order_id } = req.params;
    try {
        const saleRepository = AppDataSource.getRepository(Sale);
        const result = await saleRepository.delete({ order_id: order_id });

        if (result.affected === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting order" });
    }
});

export default router;
