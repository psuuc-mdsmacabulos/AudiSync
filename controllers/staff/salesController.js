import { AppDataSource } from "../../config/data-source.js";
import Order from "../../dist/order.js";
import OrderItem from "../../dist/order_item.js";

//

// Utility to parse date range
const parseDateRange = (start_date, end_date, interval) => {
  let start = start_date ? new Date(`${start_date}T00:00:00.000Z`) : new Date();
  let end = end_date ? new Date(`${end_date}T23:59:59.999Z`) : new Date();

  console.log("Raw start_date:", start_date);
  console.log("Raw end_date:", end_date);
  console.log("Parsed start:", start);
  console.log("Parsed end:", end);

  if (!start_date || isNaN(start.getTime())) {
    start = new Date(Date.UTC(new Date().getFullYear(), 0, 1));
    console.log("Adjusted start (default):", start);
  }

  if (!end_date || isNaN(end.getTime())) {
    end = new Date(Date.UTC(new Date().getFullYear(), 11, 31, 23, 59, 59, 999));
    console.log("Adjusted end (default):", end);
  }

  return { start, end };
};

// Utility to format dates based on interval
const getDateFormat = (interval, entityAlias) => {
  switch (interval) {
    case "daily":
      return `DATE(${entityAlias}.created_at)`;
    case "weekly":
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y-%U')`;
    case "monthly":
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y-%m')`;
    case "yearly":
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y')`;
    default:
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y-%m')`;
  }
};

export const getOverviewStatistics = async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { start_date, end_date } = req.query;

    const { start, end } = parseDateRange(start_date, end_date, "yearly");

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    console.log(`Fetching overview statistics for ${start} to ${end}`);

    const totalSalesResult = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();

    const totalSales = parseFloat(totalSalesResult.total || 0).toFixed(2);

    const totalOrdersResult = await orderRepository
      .createQueryBuilder("order")
      .select("COUNT(order.id)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();

    const totalOrders = parseInt(totalOrdersResult.total || 0);

    res.json({
      message: "Overview statistics retrieved successfully",
      data: {
        total_sales: totalSales,
        total_orders: totalOrders,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in /overview endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching overview statistics", error: error.message });
  }
};

export const GetChartStatistics = async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { start_date, end_date, interval = "monthly" } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    const { start, end } = parseDateRange(start_date, end_date, interval);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    console.log(`Fetching chart statistics for ${start} to ${end}, interval: ${interval}`);

    const salesDateFormat = getDateFormat(interval, "order");
    const salesData = await orderRepository
      .createQueryBuilder("order")
      .select(salesDateFormat, "period")
      .addSelect("SUM(order.final_price)", "total_sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(salesDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();

    const ordersDateFormat = getDateFormat(interval, "order");
    const ordersData = await orderRepository
      .createQueryBuilder("order")
      .select(ordersDateFormat, "period")
      .addSelect("COUNT(order.id)", "total_orders")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(ordersDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();

    const periods = new Set([
      ...salesData.map((entry) => entry.period),
      ...ordersData.map((entry) => entry.period),
    ]);

    let chartData = [];
    if (interval === "monthly") {
      const year = start.getFullYear();
      const allMonths = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString().padStart(2, "0");
        return `${year}-${month}`;
      });

      chartData = allMonths.map((period) => {
        const salesEntry = salesData.find((entry) => entry.period === period) || { total_sales: 0 };
        const ordersEntry = ordersData.find((entry) => entry.period === period) || { total_orders: 0 };
        return {
          period,
          total_sales: parseFloat(salesEntry.total_sales || 0).toFixed(2),
          total_orders: parseInt(ordersEntry.total_orders || 0),
        };
      });
    } else {
      chartData = Array.from(periods)
        .sort()
        .map((period) => {
          const salesEntry = salesData.find((entry) => entry.period === period) || { total_sales: 0 };
          const ordersEntry = ordersData.find((entry) => entry.period === period) || { total_orders: 0 };
          return {
            period,
            total_sales: parseFloat(salesEntry.total_sales || 0).toFixed(2),
            total_orders: parseInt(ordersEntry.total_orders || 0),
          };
        });
    }

    res.json({
      message: "Chart statistics retrieved successfully",
      data: {
        chart_data: chartData,
        interval,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in /statistics endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching chart statistics", error: error.message });
  }
};

export const getRevenueData = async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { start_date, end_date, interval = "monthly" } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    const { start, end } = parseDateRange(start_date, end_date, interval);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    console.log(`Fetching revenue data for ${start} to ${end}, interval: ${interval}`);

    const dateFormat = getDateFormat(interval, "order");
    const salesOverview = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("SUM(order.final_price)", "sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthOrders = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", {
        start: currentMonthStart,
        end: currentMonthEnd,
      })
      .andWhere("order.status = :status", { status: "completed" })
      .getRawOne();

    const totalSalesThisMonth = parseFloat(currentMonthOrders.total || 0).toFixed(2);

    res.json({
      message: "Revenue data retrieved successfully",
      data: {
        sales_overview: salesOverview.map((entry) => ({
          date: entry.date,
          sales: parseFloat(entry.sales || 0).toFixed(2),
        })),
        total_sales_this_month: totalSalesThisMonth,
      },
    });
  } catch (error) {
    console.error("Error in /profits endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching revenue data", error: error.message });
  }
};

export const getSalesData = async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const { start_date, end_date, interval = "monthly" } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    const { start, end } = parseDateRange(start_date, end_date, interval);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    console.log(`Fetching sales data for ${start} to ${end}, interval: ${interval}`);

    const dateFormat = getDateFormat("monthly", "order");
    const salesOverTime = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("SUM(order.final_price)", "sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const totalSalesThisMonthResult = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", {
        start: currentMonthStart,
        end: currentMonthEnd,
      })
      .getRawOne();

    const totalSalesThisMonth = parseFloat(totalSalesThisMonthResult.total || 0).toFixed(2);

    const daysInMonth = new Date(
      currentMonthEnd.getFullYear(),
      currentMonthEnd.getMonth() + 1,
      0
    ).getDate();
    const averageDailySales = (parseFloat(totalSalesThisMonth) / daysInMonth).toFixed(2);

    res.json({
      message: "Sales data retrieved successfully",
      data: {
        sales_over_time: salesOverTime.map((entry) => ({
          date: entry.date,
          sales: parseFloat(entry.sales || 0).toFixed(2),
        })),
        total_sales_this_month: totalSalesThisMonth,
        average_daily_sales: averageDailySales,
      },
    });
  } catch (error) {
    console.error("Error in /sales endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching sales data", error: error.message });
  }
};

export const getOrdersData = async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const { start_date, end_date, interval = "monthly" } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    const { start, end } = parseDateRange(start_date, end_date, interval);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    console.log(`Fetching orders data for ${start} to ${end}, interval: ${interval}`);

    const dateFormat = getDateFormat(interval, "order");
    const ordersOverTime = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("COUNT(order.id)", "orders")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    const topSellingProducts = await orderItemRepository
      .createQueryBuilder("orderItem")
      .leftJoin("orderItem.order", "order")
      .leftJoin("orderItem.product", "product")
      .select("product.name", "product_name")
      .addSelect("SUM(orderItem.quantity)", "quantity_sold")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("product.id")
      .addGroupBy("product.name")
      .orderBy("quantity_sold", "DESC")
      .limit(5)
      .getRawMany();

    const leastSellingProducts = await orderItemRepository
      .createQueryBuilder("orderItem")
      .leftJoin("orderItem.order", "order")
      .leftJoin("orderItem.product", "product")
      .select("product.name", "product_name")
      .addSelect("SUM(orderItem.quantity)", "quantity_sold")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("product.id")
      .addGroupBy("product.name")
      .orderBy("quantity_sold", "ASC")
      .limit(5)
      .getRawMany();

    res.json({
      message: "Orders data retrieved successfully",
      data: {
        orders_over_time: ordersOverTime.map((entry) => ({
          date: entry.date,
          orders: parseInt(entry.orders || 0),
        })),
        top_selling_products: topSellingProducts.map((product) => ({
          product_name: product.product_name || "Unknown Product",
          quantity_sold: parseInt(product.quantity_sold || 0),
        })),
        least_selling_products: leastSellingProducts.map((product) => ({
          product_name: product.product_name || "Unknown Product",
          quantity_sold: parseInt(product.quantity_sold || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Error in /orders endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching orders data", error: error.message });
  }
};