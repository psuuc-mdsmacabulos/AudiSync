import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Product from "../dist/products.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new product
router.post("/", async (req, res) => {
    const { name, description, price, quantity, image, category } = req.body;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = new Product();

        product.name = name;
        product.description = description;
        product.price = price;
        product.quantity = quantity;
        product.category = category;
        product.image = image;

        await productRepository.save(product);
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving product" });
    }
});

// Update product quantity with logged-in user
router.put("/update-quantity/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity value" });
    }

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.quantity = parseInt(quantity);
        product.updated_by = req.user.first_name + " " + req.user.last_name; 
        product.updated_at = new Date(); 

        await productRepository.save(product);

        res.json({ 
            message: "Product quantity updated successfully", 
            product,
            updated_by: req.user.first_name + " " + req.user.last_name 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating product quantity" });
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

// Get products by category
router.get("/:category", async (req, res) => {
    const { category } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({
            where: { category, deleted_at: null }
        });

        if (products.length === 0) {
            return res.status(404).json({ message: "No products found in this category" });
        }

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products by category" });
    }
});

// Soft delete a product 
router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.deleted_at = new Date();
        product.deleted_by = req.user.first_name + " " + req.user.last_name; 

        await productRepository.save(product);

        res.json({ 
            message: "Product soft deleted successfully", 
            deleted_by: req.user.first_name + " " + req.user.last_name 
        });
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
        product.deleted_by = null; 

        await productRepository.save(product);

        res.json({ message: "Product restored successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error restoring product" });
    }
});

export default router;
