import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "../../config/data-source.js";
import Sale from "../../dist/sale.js";


dotenv.config();

const router = express.Router();

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


export default router;
