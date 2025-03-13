import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Product from "../dist/products.js";
import Category from "../dist/category.js";
import Discount from "../dist/discounts.js";
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

// Add discount per product
router.post("/:id/discount", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { type, value, start_date, end_date } = req.body;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const discountRepository = AppDataSource.getRepository(Discount);

        // Validate product existence
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Validate discount type
        if (!["fixed", "percentage"].includes(type)) {
            return res.status(400).json({ message: "Invalid discount type. Must be 'fixed' or 'percentage'." });
        }

        // Validate discount value
        if (isNaN(value) || value <= 0) {
            return res.status(400).json({ message: "Invalid discount value. Must be a positive number." });
        }

        // Create new discount entry
        const discount = new Discount();
        discount.product = product;
        discount.type = type;
        discount.value = parseFloat(value);
        discount.start_date = start_date ? new Date(start_date) : new Date();
        discount.end_date = end_date ? new Date(end_date) : null;

        await discountRepository.save(discount);

        res.status(201).json({ message: "Discount added successfully", discount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding discount" });
    }
});

// Update product details with logged-in user
router.put("/update/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, quantity, category_id, image } = req.body;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const categoryRepository = AppDataSource.getRepository(Category);

        // Check if the product exists
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Validate category_id if provided
        if (category_id !== undefined) {
            const categoryExists = await categoryRepository.findOne({ where: { id: parseInt(category_id) } });
            if (!categoryExists) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            product.category_id = parseInt(category_id);
        }

        // Update only the provided fields
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined && !isNaN(price) && price >= 0) product.price = parseFloat(price);
        if (quantity !== undefined && !isNaN(quantity) && quantity >= 0) product.quantity = parseInt(quantity);
        if (image !== undefined) product.image = image;

        product.updated_by = req.user.first_name + " " + req.user.last_name;
        product.updated_at = new Date();

        await productRepository.save(product);

        res.json({
            message: "Product updated successfully",
            product,
            updated_by: req.user.first_name + " " + req.user.last_name,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating product" });
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

// Get products by id
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.findOne({ where: { id: parseInt(id) } });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products" });
    }
});

// Get products by category
router.get("/category/:category_id", async (req, res) => {
    const { category_id } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({
            where: { category_id, deleted_at: null }
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
