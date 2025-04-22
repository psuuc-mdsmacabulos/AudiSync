import express from "express";
import { AppDataSource } from "../../config/data-source.js";
import Order from "../../dist/order.js";
import OrderItem from "../../dist/order_item.js";
import Expense from "../../dist/expenses.js";
import { Between } from "typeorm";
import authMiddleware from "../../middlewares/authMiddleware.js";

const router = express.Router();

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

  // Cap the end date at the current date (Apr 22, 2025)
  const currentDate = new Date("2025-04-22T23:59:59.999Z");
  if (end > currentDate) {
    end = currentDate;
    console.log("Adjusted end (capped at current date):", end);
  }

  return { start, end };
};

const getDateFormat = (interval, entityAlias) => {
  switch (interval) {
    case "daily":
      return `DATE(${entityAlias}.created_at)`;
    case "weekly":
      return `DATE_FORMAT(${entityAlias}.created_at, '%x-%v')`; // ISO week (Monday-based)
    case "monthly":
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y-%m')`;
    case "yearly":
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y')`;
    default:
      return `DATE_FORMAT(${entityAlias}.created_at, '%Y-%m')`;
  }
};

const generatePeriods = (start, end, interval) => {
  const periods = [];
  const current = new Date(start);

  if (interval === "daily") {
    while (current <= end) {
      periods.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (interval === "weekly") {
    // Adjust start to the first Monday on or after the start date
    while (current.getUTCDay() !== 1) { // Monday is 1
      current.setDate(current.getDate() + 1);
    }
    while (current <= end) {
      const year = current.getUTCFullYear();
      const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
      const daysOffset = firstDayOfYear.getUTCDay() === 0 ? -6 : 1 - firstDayOfYear.getUTCDay();
      const firstMonday = new Date(firstDayOfYear);
      firstMonday.setDate(firstDayOfYear.getDate() + daysOffset);
      const daysSinceFirstMonday = Math.floor((current - firstMonday) / (1000 * 60 * 60 * 24));
      let weekNumber = Math.floor(daysSinceFirstMonday / 7) + 1;
      // Prevent negative or zero week numbers
      if (weekNumber <= 0) {
        weekNumber = 1;
      }
      // Adjust year if the week crosses into the previous or next year
      let periodYear = year;
      if (current.getUTCMonth() === 0 && weekNumber > 50) {
        periodYear = year - 1; // Week belongs to the previous year
      } else if (current.getUTCMonth() === 11 && weekNumber === 1) {
        periodYear = year + 1; // Week belongs to the next year
      }
      periods.push(`${periodYear}-${weekNumber.toString().padStart(2, "0")}`);
      current.setDate(current.getDate() + 7);
    }
  } else if (interval === "monthly") {
    while (current <= end) {
      const year = current.getUTCFullYear();
      const month = (current.getUTCMonth() + 1).toString().padStart(2, "0");
      periods.push(`${year}-${month}`);
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  } else if (interval === "yearly") {
    while (current <= end) {
      periods.push(current.getUTCFullYear().toString());
      current.setUTCFullYear(current.getUTCFullYear() + 1);
    }
  }

  console.log(`Generated periods for interval ${interval}:`, periods);
  return periods;
};

// Endpoint 1: Overview Statistics
router.get("/overview", authMiddleware, async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const expenseRepository = AppDataSource.getRepository(Expense);
    const { start_date, end_date, interval = "yearly" } = req.query;

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

    console.log(`Fetching overview statistics for ${start} to ${end}, interval: ${interval}`);

    // Fetch all orders to debug status values
    const allOrders = await orderRepository
      .createQueryBuilder("order")
      .select(["order.id", "order.status", "order.final_price", "order.created_at"])
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .getMany();
    console.log("All Orders (for debugging):", allOrders);

    const totalSalesResult = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .getRawOne();
    console.log("Total Sales Result (completed orders only):", totalSalesResult);

    const totalSales = parseFloat(totalSalesResult?.total || 0).toFixed(2);

    const totalExpensesResult = await expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.total_amount)", "total")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();
    console.log("Total Expenses Result:", totalExpensesResult);

    const totalExpenses = parseFloat(totalExpensesResult?.total || 0).toFixed(2);

    const totalProfits = (parseFloat(totalSales) - parseFloat(totalExpenses)).toFixed(2);

    const totalOrdersResult = await orderRepository
      .createQueryBuilder("order")
      .select("COUNT(order.id)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .getRawOne();
    console.log("Total Orders Result (completed orders only):", totalOrdersResult);

    const totalOrders = parseInt(totalOrdersResult?.total || 0);

    res.json({
      message: "Overview statistics retrieved successfully",
      data: {
        total_sales: totalSales,
        total_profits: totalProfits,
        total_expenses: totalExpenses,
        total_orders: totalOrders,
        interval,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in /overview endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching overview statistics", error: error.message });
  }
});

// Endpoint 2: Chart Data (Statistics)
router.get("/statistics", authMiddleware, async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const expenseRepository = AppDataSource.getRepository(Expense);
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
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy(salesDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();
    console.log("Statistics Sales Data (completed orders only):", salesData);

    const expensesDateFormat = getDateFormat(interval, "expense");
    const expensesData = await expenseRepository
      .createQueryBuilder("expense")
      .select(expensesDateFormat, "period")
      .addSelect("SUM(expense.total_amount)", "total_expenses")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(expensesDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();
    console.log("Statistics Expenses Data:", expensesData);

    const ordersDateFormat = getDateFormat(interval, "order");
    const ordersData = await orderRepository
      .createQueryBuilder("order")
      .select(ordersDateFormat, "period")
      .addSelect("COUNT(order.id)", "total_orders")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy(ordersDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();
    console.log("Statistics Orders Data (completed orders only):", ordersData);

    const allPeriods = generatePeriods(start, end, interval);

    const chartData = allPeriods.map((period) => {
      const salesEntry = salesData.find((entry) => entry.period === period) || { total_sales: 0 };
      const expensesEntry = expensesData.find((entry) => entry.period === period) || { total_expenses: 0 };
      const ordersEntry = ordersData.find((entry) => entry.period === period) || { total_orders: 0 };
      const totalSales = parseFloat(salesEntry.total_sales || 0);
      const totalExpenses = parseFloat(expensesEntry.total_expenses || 0);
      const totalProfits = totalSales - totalExpenses;
      return {
        period,
        total_sales: totalSales.toFixed(2),
        total_expenses: totalExpenses.toFixed(2),
        total_profits: totalProfits.toFixed(2),
        total_orders: parseInt(ordersEntry.total_orders || 0),
      };
    });

    console.log("Statistics Final Chart Data:", chartData);

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
});

// Endpoint 3: Profits Dashboard Data
router.get("/profitsdash", authMiddleware, async (req, res) => {
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database connection is not initialized.");
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const expenseRepository = AppDataSource.getRepository(Expense);
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

    console.log(`Fetching profits data for ${start.toISOString()} to ${end.toISOString()}, interval: ${interval}`);

    const salesDateFormat = getDateFormat(interval, "order");
    const salesData = await orderRepository
      .createQueryBuilder("order")
      .select(salesDateFormat, "period")
      .addSelect("SUM(order.final_price)", "total_sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy(salesDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();
    console.log("Profits Dashboard Sales Data:", salesData);

    const expensesDateFormat = getDateFormat(interval, "expense");
    const expensesData = await expenseRepository
      .createQueryBuilder("expense")
      .select(expensesDateFormat, "period")
      .addSelect("SUM(expense.total_amount)", "total_expenses")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(expensesDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();
    console.log("Profits Dashboard Expenses Data:", expensesData);

    const allPeriods = generatePeriods(start, end, interval);
    const profitByPeriod = allPeriods.map((period) => {
      const salesEntry = salesData.find((entry) => entry.period === period) || { total_sales: 0 };
      const expensesEntry = expensesData.find((entry) => entry.period === period) || { total_expenses: 0 };
      const revenue = parseFloat(salesEntry.total_sales || 0);
      const expense = parseFloat(expensesEntry.total_expenses || 0);
      const profit = revenue - expense;
      return {
        date: period,
        profit: profit >= 0 ? profit.toFixed(2) : "0.00",
      };
    });
    console.log("Profits Dashboard Profit By Period:", profitByPeriod);

    const totalSalesResult = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .getRawOne();
    const totalSales = parseFloat(totalSalesResult?.total || 0);

    const totalExpensesResult = await expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.total_amount)", "total")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();
    const totalExpenses = parseFloat(totalExpensesResult?.total || 0);

    const totalProfits = totalSales - totalExpenses;

    const currentMonthStart = new Date(2025, 3, 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(2025, 3, 22);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthOrders = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start: currentMonthStart, end: currentMonthEnd })
      .andWhere("order.status = :status", { status: "completed" })
      .getRawOne();
    const currentMonthRevenue = parseFloat(currentMonthOrders?.total || 0);
    console.log("Current Month Orders (Apr 2025):", currentMonthOrders, "Revenue:", currentMonthRevenue);

    const currentMonthExpenses = await expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.total_amount)", "total")
      .where("expense.created_at BETWEEN :start AND :end", { start: currentMonthStart, end: currentMonthEnd })
      .getRawOne();
    const currentMonthTotalExpenses = parseFloat(currentMonthExpenses?.total || 0);
    console.log("Current Month Expenses (Apr 2025):", currentMonthExpenses, "Total:", currentMonthTotalExpenses);

    const totalProfitThisMonth = currentMonthRevenue - currentMonthTotalExpenses;

    let highestProfit = "0.00";
    let highestProfitMonth = "";
    profitByPeriod.forEach((entry) => {
      const profit = parseFloat(entry.profit);
      if (profit > parseFloat(highestProfit)) {
        highestProfit = profit.toFixed(2);
        highestProfitMonth = entry.date;
      }
    });

    res.json({
      message: "Profits data retrieved successfully",
      data: {
        profit_overview: profitByPeriod,
        total_profits: totalProfits.toFixed(2),
        total_profit_this_month: totalProfitThisMonth >= 0 ? totalProfitThisMonth.toFixed(2) : "0.00",
        highest_profit: highestProfit,
        highest_profit_month: highestProfitMonth,
        interval,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in /profitsdash endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching profits data", error: error.message });
  }
});

// Endpoint 4: Sales Dashboard Data
router.get("/sales", authMiddleware, async (req, res) => {
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

    console.log(`Fetching sales data for ${start.toISOString()} to ${end.toISOString()}, interval: ${interval}`);

    // Debug: Fetch all orders in the date range to check status
    const allOrders = await orderRepository
      .createQueryBuilder("order")
      .select(["order.id", "order.status", "order.final_price", "order.created_at", "order.order_type", "order.payment_method"])
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .getMany();
    console.log("All Orders in Date Range (for debugging):", allOrders);

    const dateFormat = getDateFormat(interval, "order");
    const salesOverTime = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("SUM(order.final_price)", "sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();
    console.log("Sales Over Time:", salesOverTime);

    const currentMonthStart = new Date();
    currentMonthStart.setUTCDate(1);
    currentMonthStart.setUTCHours(0, 0, 0, 0);
    const currentMonthEnd = new Date();
    currentMonthEnd.setUTCMonth(currentMonthEnd.getUTCMonth() + 1, 0);
    currentMonthEnd.setUTCHours(23, 59, 59, 999);

    const totalSalesThisMonthResult = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", {
        start: currentMonthStart,
        end: currentMonthEnd,
      })
      .andWhere("order.status = :status", { status: "completed" })
      .getRawOne();
    console.log("Total Sales This Month Result:", totalSalesThisMonthResult);

    const totalSalesThisMonth = parseFloat(totalSalesThisMonthResult?.total || 0);

    const daysInMonth = new Date(
      currentMonthEnd.getUTCFullYear(),
      currentMonthEnd.getUTCMonth() + 1,
      0
    ).getUTCDate();
    const averageDailySales = totalSalesThisMonth / daysInMonth;

    const salesByOrderType = await orderRepository
      .createQueryBuilder("order")
      .select("order.order_type", "order_type")
      .addSelect("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy("order.order_type")
      .getRawMany();
    console.log("Sales By Order Type:", salesByOrderType);

    const orderTypeBreakdown = {
      "dine-in": 0,
      "take-out": 0,
      delivery: 0,
    };

    salesByOrderType.forEach((item) => {
      const type = item.order_type?.toLowerCase() || "";
      if (type in orderTypeBreakdown) {
        orderTypeBreakdown[type] = parseFloat(item.total || 0);
      }
    });

    const paymentMethodBreakdownResult = await orderRepository
      .createQueryBuilder("order")
      .select("order.payment_method", "payment_method")
      .addSelect("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy("order.payment_method")
      .getRawMany();
    console.log("Payment Method Breakdown Result:", paymentMethodBreakdownResult);

    const paymentMethodBreakdown = {
      cash: 0,
      credit_card: 0,
    };

    if (Array.isArray(paymentMethodBreakdownResult)) {
      paymentMethodBreakdownResult.forEach((item) => {
        const method = item.payment_method?.toLowerCase() || "";
        if (method in paymentMethodBreakdown) {
          paymentMethodBreakdown[method] = parseFloat(item.total || 0);
        }
      });
    } else {
      console.warn("Payment Method Breakdown Result is not an array:", paymentMethodBreakdownResult);
    }

    res.json({
      message: "Sales data retrieved successfully",
      data: {
        sales_over_time: salesOverTime.map((entry) => ({
          date: entry.date,
          sales: parseFloat(entry.sales || 0).toFixed(2),
        })),
        total_sales_this_month: totalSalesThisMonth.toFixed(2),
        average_daily_sales: averageDailySales.toFixed(2),
        order_type_breakdown: {
          dine_in: orderTypeBreakdown["dine-in"].toFixed(2),
          take_out: orderTypeBreakdown["take-out"].toFixed(2),
          delivery: orderTypeBreakdown.delivery.toFixed(2),
        },
        payment_method_breakdown: {
          cash: paymentMethodBreakdown.cash.toFixed(2),
          credit_card: paymentMethodBreakdown.credit_card.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Error in /sales endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching sales data", error: error.message });
  }
});

// Endpoint 5: Expenses Dashboard Data
router.get("/expenses", authMiddleware, async (req, res) => {
  try {
    const expenseRepository = AppDataSource.getRepository(Expense);
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

    console.log(`Fetching expenses data for ${start} to ${end}, interval: ${interval}`);

    const dateFormat = getDateFormat(interval, "expense");
    const expensesOverTimeQuery = await expenseRepository
      .createQueryBuilder("expense")
      .leftJoin("expense.category", "category")
      .select(dateFormat, "date")
      .addSelect("category.name", "category_name")
      .addSelect("SUM(expense.total_amount)", "amount")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat)
      .addGroupBy("category.name")
      .orderBy("date", "ASC")
      .getRawMany();

    const expensesOverTime = [];
    const dates = [...new Set(expensesOverTimeQuery.map((entry) => entry.date))];
    dates.forEach((date) => {
      const entriesForDate = expensesOverTimeQuery.filter((entry) => entry.date === date);
      const entry = { date };
      entriesForDate.forEach((e) => {
        entry[e.category_name || "Uncategorized"] = parseFloat(e.amount || 0).toFixed(2);
      });
      expensesOverTime.push(entry);
    });

    const expenseCategories = await expenseRepository
      .createQueryBuilder("expense")
      .leftJoin("expense.category", "category")
      .select("category.name", "name")
      .addSelect("SUM(expense.total_amount)", "amount")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("category.name")
      .getRawMany();

    const now = new Date();
    const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const endOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999);
    const totalExpensesThisMonth = await expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.total_amount)", "total")
      .where("expense.created_at BETWEEN :start AND :end", { start: startOfMonth, end: endOfMonth })
      .getRawOne();

    res.json({
      message: "Expenses data retrieved successfully",
      data: {
        expenses_over_time: expensesOverTime,
        expense_categories: expenseCategories.map((category) => ({
          name: category.name || "Uncategorized",
          amount: parseFloat(category.amount || 0).toFixed(2),
        })),
        total_expenses_this_month: parseFloat(totalExpensesThisMonth?.total || 0).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error in /expenses endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching expenses data", error: error.message });
  }
});

// Endpoint 6: Orders Dashboard Data
router.get("/orders", authMiddleware, async (req, res) => {
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
      .andWhere("order.status = :status", { status: "completed" })
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
      .andWhere("order.status = :status", { status: "completed" })
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
      .andWhere("order.status = :status", { status: "completed" })
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
});

export default router;