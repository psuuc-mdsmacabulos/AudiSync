import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Discount from "../dist/discounts.js";
import Product from "../dist/products.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all discounts with optional status filter
router.get("/", authMiddleware, async (req, res) => {
  try {
    const discountRepository = AppDataSource.getRepository(Discount);
    const status = req.query.status || "active"; // Default to active
    const discounts = await discountRepository.find({
      where: { status },
      relations: ["product"], // Include related product data
    });
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching discounts", error: error.message });
  }
});

// Get a single discount by ID
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const discountRepository = AppDataSource.getRepository(Discount);
    const discount = await discountRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["product"],
    });
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    res.json(discount);
  } catch (error) {
    res.status(500).json({ message: "Error fetching discount", error: error.message });
  }
});

// Create a discount
router.post("/", authMiddleware, async (req, res) => {
  const { type, value, start_date, end_date, product_id } = req.body;

  // Basic validation
  if (!["fixed", "percentage"].includes(type)) {
    return res.status(400).json({ message: "Type must be 'fixed' or 'percentage'" });
  }
  if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
    return res.status(400).json({ message: "Value must be a positive number" });
  }
  if (!start_date) {
    return res.status(400).json({ message: "Start date is required" });
  }
  if (!product_id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const discountRepository = AppDataSource.getRepository(Discount);
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({ where: { id: parseInt(product_id) } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const discount = new Discount();
    discount.type = type;
    discount.value = parseFloat(value);
    discount.start_date = new Date(start_date);
    discount.end_date = end_date ? new Date(end_date) : null;
    discount.product = product;
    discount.status = "active"; // Set default status to active

    const savedDiscount = await discountRepository.save(discount);
    res.status(201).json(savedDiscount);
  } catch (error) {
    res.status(500).json({ message: "Error creating discount", error: error.message });
  }
});

// Update a discount
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { type, value, start_date, end_date, product_id, status } = req.body;

  try {
    const discountRepository = AppDataSource.getRepository(Discount);
    const productRepository = AppDataSource.getRepository(Product);

    const discount = await discountRepository.findOne({ where: { id: parseInt(id) } });
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }

    if (type && !["fixed", "percentage"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'fixed' or 'percentage'" });
    }
    if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
      return res.status(400).json({ message: "Value must be a positive number" });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'" });
    }

    discount.type = type || discount.type;
    discount.value = value ? parseFloat(value) : discount.value;
    discount.start_date = start_date ? new Date(start_date) : discount.start_date;
    discount.end_date = end_date !== undefined ? (end_date ? new Date(end_date) : null) : discount.end_date;
    discount.status = status || discount.status; // Allow status update

    if (product_id !== undefined) {
      if (!product_id) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      const product = await productRepository.findOne({ where: { id: parseInt(product_id) } });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      discount.product = product;
    }

    const updatedDiscount = await discountRepository.save(discount);
    res.json(updatedDiscount);
  } catch (error) {
    res.status(500).json({ message: "Error updating discount", error: error.message });
  }
});

// Toggle discount status (replace DELETE route)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const discountRepository = AppDataSource.getRepository(Discount);
    const discount = await discountRepository.findOne({ where: { id: parseInt(id) } });
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'" });
    }

    discount.status = status;
    const updatedDiscount = await discountRepository.save(discount);
    res.json(updatedDiscount);
  } catch (error) {
    res.status(500).json({ message: "Error updating discount status", error: error.message });
  }
});

export default router;