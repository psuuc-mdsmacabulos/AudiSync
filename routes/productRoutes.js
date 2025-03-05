import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Product from "../dist/products.js";

const router = express.Router();

// Create a new product
router.post("/", async (req, res) => {
    const { name, description, price, stock, image } = req.body;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = new Product();

        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.image = image;

        await productRepository.save(product);
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving product" });
    }
});

// Get all active (non-deleted) products
router.get("/", async (req, res) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({ where: { deleted_at: null } });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products" });
    }
});

// Soft delete a product
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.deleted_at = new Date();
        await productRepository.save(product);

        res.json({ message: "Product soft deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting product" });
    }
});

// Restore a soft-deleted product
router.put("/restore/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.deleted_at = null;
        await productRepository.save(product);

        res.json({ message: "Product restored successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error restoring product" });
    }
});

export default router;
