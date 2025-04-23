import express from "express";
import { AppDataSource } from "../../config/data-source.js";
import Product from "../../dist/products.js";
import Category from "../../dist/category.js";
import Discount from "../../dist/discounts.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { IsNull, Not } from "typeorm";
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/products');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."));
        }
    },
});

// Create a new category
router.post("/categories", authMiddleware, async (req, res) => {
    const { name } = req.body;

    try {
        const categoryRepository = AppDataSource.getRepository(Category);

        // Validate input
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Category name is required and must be a non-empty string" });
        }

        // Check if category already exists (since name is unique)
        const existingCategory = await categoryRepository.findOne({ where: { name: name.trim() } });
        if (existingCategory) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        // Create new category
        const category = new Category();
        category.name = name.trim();

        // Save category to the database
        const savedCategory = await categoryRepository.save(category);

        res.status(201).json({
            message: "Category created successfully",
            category: savedCategory,
            created_by: `${req.user.first_name} ${req.user.last_name}`,
        });
    } catch (error) {
        console.error("Error creating category:", error.message);
        res.status(500).json({ message: `Error creating category: ${error.message}` });
    }
});

router.post("/", upload.single('image'), async (req, res) => {
    let { name, description, price, quantity, category_id, imageUrl } = req.body;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const categoryRepository = AppDataSource.getRepository(Category);

        // Convert to proper types and handle NaN
        price = isNaN(Number(price)) ? 0 : parseFloat(price);
        quantity = isNaN(Number(quantity)) ? 0 : parseInt(quantity);
        const categoryId = isNaN(Number(category_id)) ? null : parseInt(category_id);

        // Validate category existence only if category_id is provided
        let category = null;
        if (categoryId) {
            category = await categoryRepository.findOne({ where: { id: categoryId } });
            if (!category) {
                if (req.file) {
                    fs.unlinkSync(req.file.path); // Delete uploaded file if category not found
                }
                return res.status(400).json({ message: "Category not found" });
            }
        }

        // Create the product
        const product = new Product();
        product.name = name?.trim() || "";
        product.description = description?.trim() || "";
        product.price = price;
        product.quantity = quantity;
        product.category = category || null;
        product.is_active = quantity > 0; // Set initial active status based on quantity

        // Handle image upload or URL
        if (req.file) {
            const imagePath = `/uploads/products/${req.file.filename}`;
            product.image = imagePath;
            try {
                product.image_data = fs.readFileSync(req.file.path); // Save binary data if needed
            } catch (err) {
                console.warn("Failed to read image file:", err.message);
                product.image_data = null;
            }
        } else if (imageUrl) {
            product.image = imageUrl;
            product.image_data = null; // No binary data for URL-based image
        } else {
            product.image = null;
            product.image_data = null;
        }

        // Save product to the database
        const savedProduct = await productRepository.save(product);

        res.status(201).json({
            message: "Product created successfully",
            product: savedProduct
        });
    } catch (error) {
        console.error("Error saving product:", error.message);
        
        // Delete file if an error occurs
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                console.warn("Failed to delete file:", unlinkErr.message);
            }
        }

        res.status(500).json({ message: `Error saving product: ${error.message}` });
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

// Update a category
router.put("/categories/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Validate input
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Category name is required and must be a non-empty string" });
        }

        // Check for duplicate name (excluding the current category)
        const existingCategory = await categoryRepository.findOne({ where: { name: name.trim() } });
        if (existingCategory && existingCategory.id !== parseInt(id)) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        // Update category
        category.name = name.trim();
        const updatedCategory = await categoryRepository.save(category);

        res.json({
            message: "Category updated successfully",
            category: updatedCategory,
            updated_by: `${req.user.first_name} ${req.user.last_name}`,
        });
    } catch (error) {
        console.error("Error updating category:", error.message);
        res.status(500).json({ message: `Error updating category: ${error.message}` });
    }
});

router.put("/update/:id", authMiddleware, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, quantity, category_id, imageUrl, is_active } = req.body;

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
            const category = await categoryRepository.findOne({ where: { id: parseInt(category_id) } });
            if (!category) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            product.category = category;
        }

        // Update only the provided fields
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined && !isNaN(price) && price >= 0) product.price = parseFloat(price);
        if (quantity !== undefined && !isNaN(quantity) && quantity >= 0) {
            product.quantity = parseInt(quantity);
            // Automatically disable product if quantity is 0
            product.is_active = quantity > 0 ? product.is_active : false;
        }
        if (is_active !== undefined) product.is_active = is_active;

        // Handle image update (either file upload or URL)
        if (req.file) {
            // Delete old image if exists
            if (product.image) {
                const oldImagePath = `public${product.image}`;
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save new file
            const imagePath = `/uploads/products/${req.file.filename}`;
            product.image = imagePath;
            product.image_data = fs.readFileSync(req.file.path);
        } else if (imageUrl) {
            product.image = imageUrl;
            product.image_data = null;
        }

        // Set update details
        product.updated_by = `${req.user.first_name} ${req.user.last_name}`;
        product.updated_at = new Date();

        // Save updated product to the database
        await productRepository.save(product);

        res.json({
            message: "Product updated successfully",
            product,
            updated_by: `${req.user.first_name} ${req.user.last_name}`,
        });
    } catch (error) {
        console.error("Error updating product:", error.message);

        // Improved error handling
        res.status(500).json({ message: `Error updating product: ${error.message}` });
    }
});

// New endpoint to toggle product active status
router.put("/toggle-active/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: parseInt(id) } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Toggle the is_active status
        product.is_active = !product.is_active;
        product.updated_by = `${req.user.first_name} ${req.user.last_name}`;
        product.updated_at = new Date();

        // If product is being disabled and has stock, allow manual override
        // If product is being enabled but has no stock, prevent it
        if (product.is_active && product.quantity <= 0) {
            return res.status(400).json({ 
                message: "Cannot enable product with zero quantity" 
            });
        }

        await productRepository.save(product);

        res.json({
            message: `Product ${product.is_active ? 'enabled' : 'disabled'} successfully`,
            product,
            updated_by: `${req.user.first_name} ${req.user.last_name}`,
        });
    } catch (error) {
        console.error("Error toggling product status:", error.message);
        res.status(500).json({ 
            message: `Error toggling product status: ${error.message}` 
        });
    }
});

// Fetch not soft deleted products with discounts
router.get("/", async (req, res) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({
            where: { deleted_at: IsNull() },
            relations: ["discounts"], 
        });

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products" });
    }
});

// Fetch soft deleted
router.get("/deleted", async (req, res) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({ where: { deleted_at: Not(IsNull()) } });

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products" });
    }
});

// Get all active products (is_active)
router.get("/active", async (req, res) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({ where: { is_active: true } });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products" });
    }
});

// Get all inactive products (is_active)
router.get("/inactive", async (req, res) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({ where: { is_active: false } });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products" });
    }
});

// Get categories
router.get("/categories", async (req, res) => {
    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const categories = await categoryRepository.find();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories" });
    }
});

// Get products by category
router.get("/category/:category_id", async (req, res) => {
    const { category_id } = req.params;
    const categoryId = parseInt(category_id, 10);

    if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
    }

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const products = await productRepository.find({
            where: { category_id: categoryId, deleted_at: null }
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

// Get products by id
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: productId } });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching product" });
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

// Delete a category (hard delete)
router.delete("/categories/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Check if category has associated products
        const productRepository = AppDataSource.getRepository(Product);
        const productsInCategory = await productRepository.count({ where: { category_id: parseInt(id) } });
        if (productsInCategory > 0) {
            return res.status(400).json({ message: "Cannot delete category with associated products" });
        }

        // Hard delete the category
        await categoryRepository.remove(category);

        res.json({
            message: "Category deleted successfully",
            deleted_by: `${req.user.first_name} ${req.user.last_name}`,
        });
    } catch (error) {
        console.error("Error deleting category:", error.message);
        res.status(500).json({ message: `Error deleting category: ${error.message}` });
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