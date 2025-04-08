import express from "express";
import { AppDataSource } from "../../config/data-source.js";
import Order from "../../dist/order.js";
import OrderItem from "../../dist/order_item.js";
import { Between } from "typeorm"; // Removed Raw since we'll handle it differently
import authMiddleware from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Helper function to parse date range and interval
const parseDateRange = (start_date, end_date, interval) => {
  const start = start_date ? new Date(start_date) : new Date();
  const end = end_date ? new Date(end_date) : new Date();

  // Adjust start and end based on interval if not provided
  if (!start_date || !end_date) {
    switch (interval) {
      case "daily":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        start.setDate(start.getDate() - start.getDay()); // Start of the week (Sunday)
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6); // End of the week (Saturday)
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start.setDate(1); // Start of the month
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0); // End of the month
        end.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        start.setMonth(0, 1); // Start of the year
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31); // End of the year
        end.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error("Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'.");
    }
  }

  return { start, end };
};

// Helper function to get date format for grouping (MySQL/MariaDB-compatible)
const getDateFormat = (interval) => {
  switch (interval) {
    case "daily":
      return "DATE(order.created_at)";
    case "weekly":
      return "YEARWEEK(order.created_at, 1)"; // Returns YYYYWW (e.g., 202503)
    case "monthly":
      return "DATE_FORMAT(order.created_at, '%Y-%m')"; // Returns YYYY-MM (e.g., 2025-03)
    case "yearly":
      return "YEAR(order.created_at)"; // Returns YYYY (e.g., 2025)
    default:
      throw new Error("Invalid interval for grouping. Use 'daily', 'weekly', 'monthly', or 'yearly'.");
  }
};

// Endpoint 1: Overall Sales Analytics (Total Final Price with Date Filtering)
router.get("/sales", authMiddleware, async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { start_date, end_date, interval = "monthly" } = req.query;

    // Validate interval
    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    // Parse date range
    const { start, end } = parseDateRange(start_date, end_date, interval);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    // Log the date range for debugging
    console.log(`Fetching sales analytics for ${start} to ${end}, interval: ${interval}`);

    // Build query for total sales with date grouping
    const dateFormat = getDateFormat(interval);
    const salesData = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "period") 
      .addSelect("SUM(order.final_price)", "total_sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat) 
      .orderBy("period", "ASC")
      .getRawMany();

    // Calculate overall total sales
    const totalSales = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();

    res.json({
      message: "Sales analytics retrieved successfully",
      data: {
        sales_by_period: salesData.map((entry) => ({
          period: entry.period,
          total_sales: parseFloat(entry.total_sales || 0).toFixed(2),
        })),
        total_sales: parseFloat(totalSales.total || 0).toFixed(2),
        interval,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in /sales endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching sales analytics", error: error.message });
  }
});

// Endpoint 2: Product Sales Analytics (Best and Least Selling Products with Date Filtering)
router.get("/products", authMiddleware, async (req, res) => {
  try {
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const { start_date, end_date, interval = "monthly", limit = 5 } = req.query;

    // Validate interval
    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    // Validate limit
    const limitNumber = parseInt(limit);
    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res.status(400).json({ message: "Limit must be a positive integer." });
    }

    // Parse date range
    const { start, end } = parseDateRange(start_date, end_date, interval);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    // Log the date range for debugging
    console.log(`Fetching product analytics for ${start} to ${end}, interval: ${interval}, limit: ${limitNumber}`);

    // Query for product sales (group by product)
    console.log("Fetching product sales...");
    const productSales = await orderItemRepository
      .createQueryBuilder("orderItem")
      .leftJoin("orderItem.order", "order")
      .leftJoin("orderItem.product", "product")
      .select("product.id", "product_id")
      .addSelect("product.name", "product_name")
      .addSelect("SUM(orderItem.quantity)", "total_quantity")
      .addSelect("SUM(orderItem.total_price)", "total_revenue")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("product.id, product.name")
      .orderBy("total_quantity", "DESC")
      .getRawMany();

    console.log("Product sales fetched:", productSales);

    // Best-selling products (top N)
    const bestSelling = productSales.slice(0, limitNumber).map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name || "Unknown Product",
      total_quantity: parseInt(item.total_quantity || 0),
      total_revenue: parseFloat(item.total_revenue || 0).toFixed(2),
    }));

    // Least-selling products (bottom N, excluding products with 0 sales if possible)
    const leastSelling = productSales
      .filter((item) => parseInt(item.total_quantity) > 0)
      .slice(-limitNumber)
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name || "Unknown Product",
        total_quantity: parseInt(item.total_quantity || 0),
        total_revenue: parseFloat(item.total_revenue || 0).toFixed(2),
      }));

    // Product sales by period (for graphing trends)
    console.log("Fetching product sales by period...");
    const dateFormat = getDateFormat(interval);
    const productSalesByPeriod = await orderItemRepository
      .createQueryBuilder("orderItem")
      .leftJoin("orderItem.order", "order")
      .leftJoin("orderItem.product", "product")
      .select(dateFormat, "period") 
      .addSelect("product.id", "product_id")
      .addSelect("product.name", "product_name")
      .addSelect("SUM(orderItem.quantity)", "total_quantity")
      .addSelect("SUM(orderItem.total_price)", "total_revenue")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(`${dateFormat}, product.id, product.name`) 
      .orderBy("period", "ASC")
      .addOrderBy("total_quantity", "DESC")
      .getRawMany();

    console.log("Product sales by period fetched:", productSalesByPeriod);

    res.json({
      message: "Product sales analytics retrieved successfully",
      data: {
        best_selling: bestSelling,
        least_selling: leastSelling,
        sales_by_period: productSalesByPeriod.map((entry) => ({
          period: entry.period,
          product_id: entry.product_id,
          product_name: entry.product_name || "Unknown Product",
          total_quantity: parseInt(entry.total_quantity || 0),
          total_revenue: parseFloat(entry.total_revenue || 0).toFixed(2),
        })),
        interval,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in /products endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching product sales analytics", error: error.message });
  }
});

export default router;