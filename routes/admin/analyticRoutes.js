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

  return { start, end };
};

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

// Endpoint 1: Overview Statistics (Total Sales, Profits, Expenses, Orders)
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

    const totalSalesResult = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();

    const totalSales = parseFloat(totalSalesResult.total || 0).toFixed(2);

    const totalExpensesResult = await expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.total_amount)", "total")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .getRawOne();

    const totalExpenses = parseFloat(totalExpensesResult.total || 0).toFixed(2);

    const totalProfits = (parseFloat(totalSales) - parseFloat(totalExpenses)).toFixed(2);

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

// Endpoint 2: Chart Data (Sales, Expenses, Profits, and Orders by Period)
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
      .groupBy(salesDateFormat)
      .orderBy("period", "ASC")
      .getRawMany();

    const expensesDateFormat = getDateFormat(interval, "expense");
    const expensesData = await expenseRepository
      .createQueryBuilder("expense")
      .select(expensesDateFormat, "period")
      .addSelect("SUM(expense.total_amount)", "total_expenses")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(expensesDateFormat)
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
      ...expensesData.map((entry) => entry.period),
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
    } else {
      chartData = Array.from(periods)
        .sort()
        .map((period) => {
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
});

// Endpoint 3: Profits Dashboard Data
router.get("/profits", authMiddleware, async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const expenseRepository = AppDataSource.getRepository(Expense);
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

    console.log(`Fetching profits data for ${start} to ${end}, interval: ${interval}`);

    // Total Revenue from Orders
    const orders = await orderRepository.find({
      where: { created_at: Between(start, end), status: "completed" },
      relations: ["orderItems"],
    });

    let totalRevenue = 0;
    for (const order of orders) {
      totalRevenue += parseFloat(order.final_price || 0);
    }

    // Total Expenses
    const expenses = await expenseRepository.find({
      where: { created_at: Between(start, end) },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);

    // Distribute expenses proportionally to each order based on its revenue contribution
    const revenueContribution = orders.map((order) => ({
      order,
      contribution: totalRevenue > 0 ? parseFloat(order.final_price || 0) / totalRevenue : 0,
    }));

    const ordersWithExpenses = revenueContribution.map(({ order, contribution }) => ({
      order,
      allocatedExpense: contribution * totalExpenses,
    }));

    // Calculate profit per month
    const dateFormat = getDateFormat("monthly", "order");
    const profitOverview = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("SUM(order.final_price)", "revenue")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .andWhere("order.status = :status", { status: "completed" })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    // Calculate expenses per month
    const expenseByMonth = await expenseRepository
      .createQueryBuilder("expense")
      .select(dateFormat, "date")
      .addSelect("SUM(expense.amount)", "expense")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    // Merge revenue and expenses to calculate profit per month
    const profitByMonth = profitOverview.map((entry) => {
      const expenseEntry = expenseByMonth.find((exp) => exp.date === entry.date) || { expense: 0 };
      const profit = parseFloat(entry.revenue || 0) - parseFloat(expenseEntry.expense || 0);
      return {
        date: entry.date,
        profit: profit > 0 ? profit : 0, // Ensure profit is not negative
      };
    });

    // Total Profit This Month
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthOrders = await orderRepository.find({
      where: {
        created_at: Between(currentMonthStart, currentMonthEnd),
        status: "completed",
      },
      relations: ["orderItems"],
    });

    let currentMonthRevenue = 0;
    for (const order of currentMonthOrders) {
      currentMonthRevenue += parseFloat(order.final_price || 0);
    }

    const currentMonthExpenses = await expenseRepository.find({
      where: { created_at: Between(currentMonthStart, currentMonthEnd) },
    });

    const currentMonthTotalExpenses = currentMonthExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount || 0),
      0
    );

    const totalProfitThisMonth = currentMonthRevenue - currentMonthTotalExpenses;

    // Highest Profit (max profit in any month)
    const highestProfit = profitByMonth.reduce(
      (max, entry) => Math.max(max, parseFloat(entry.profit || 0)),
      0
    );

    res.json({
      message: "Profits data retrieved successfully",
      data: {
        profit_overview: profitByMonth.map((entry) => ({
          date: entry.date,
          profit: parseFloat(entry.profit || 0).toFixed(2),
        })),
        total_profit_this_month: totalProfitThisMonth > 0 ? totalProfitThisMonth.toFixed(2) : "0.00",
        highest_profit: highestProfit.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error in /profits endpoint:", error.stack);
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

    console.log(`Fetching sales data for ${start} to ${end}, interval: ${interval}`);

    // Sales Overview (Monthly Sales for the Year)
    const dateFormat = getDateFormat("monthly", "order");
    const salesOverTime = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("SUM(order.final_price)", "sales")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    // Total Sales This Month
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

    const totalSalesThisMonth = parseFloat(totalSalesThisMonthResult.total || 0);

    // Average Daily Sales (for the current month)
    const daysInMonth = new Date(
      currentMonthEnd.getFullYear(),
      currentMonthEnd.getMonth() + 1,
      0
    ).getDate();
    const averageDailySales = totalSalesThisMonth / daysInMonth;

    // Sales by Order Type
    const salesByOrderType = await orderRepository
      .createQueryBuilder("order")
      .select("order.order_type", "order_type")
      .addSelect("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("order.order_type")
      .getRawMany();

    const orderTypeBreakdown = {
      "dine-in": 0,
      "take-out": 0,
      delivery: 0,
    };

    salesByOrderType.forEach((item) => {
      const type = item.order_type.toLowerCase();
      if (type in orderTypeBreakdown) {
        orderTypeBreakdown[type] = parseFloat(item.total || 0);
      }
    });

    // Payment Method Breakdown
    const paymentMethodBreakdownResult = await orderRepository
      .createQueryBuilder("order")
      .select("order.payment_method", "payment_method")
      .addSelect("SUM(order.final_price)", "total")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("order.payment_method")
      .getRawMany();

    const paymentMethodBreakdown = {
      cash: 0,
      credit_card: 0,
    };

    paymentMethodBreakdownResult.forEach((item) => {
      const method = item.payment_method.toLowerCase();
      if (method in paymentMethodBreakdown) {
        paymentMethodBreakdown[method] = parseFloat(item.total || 0);
      }
    });

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

// Endpoint 5: Profits Dashboard Data
router.get("/profitsdash", authMiddleware, async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const expenseRepository = AppDataSource.getRepository(Expense);
    const { start_date, end_date, interval = "monthly" } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ message: "Invalid interval. Use 'daily', 'weekly', 'monthly', or 'yearly'." });
    }

    const { start, end } = parseDateRange(start_date, end_date, interval);

    console.log("Final start and end (UTC):", { start, end });

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    console.log(`Fetching profits data for ${start} to ${end}, interval: ${interval}`);

    // Total Revenue from Orders
    const orders = await orderRepository.find({
      where: { created_at: Between(start, end), status: "completed" },
    });
    console.log("Fetched orders:", orders);

    let totalRevenue = 0;
    for (const order of orders) {
      const finalPrice = parseFloat(order.final_price) || 0;
      if (isNaN(finalPrice)) {
        console.warn(`Invalid final_price for order ID ${order.id}: ${order.final_price}`);
      }
      totalRevenue += finalPrice;
    }
    console.log("Total revenue:", totalRevenue);

    // Total Expenses
    const expenses = await expenseRepository.find({
      where: { created_at: Between(start, end) },
    });
    console.log("Fetched expenses:", expenses);

    const totalExpenses = expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      if (isNaN(amount)) {
        console.warn(`Invalid amount for expense ID ${expense.id}: ${expense.amount}`);
      }
      return sum + amount;
    }, 0);
    console.log("Total expenses:", totalExpenses);

    // Distribute expenses proportionally to each order based on its revenue contribution
    const revenueContribution = orders.map((order) => ({
      order,
      contribution: totalRevenue > 0 ? (parseFloat(order.final_price) || 0) / totalRevenue : 0,
    }));

    const ordersWithExpenses = revenueContribution.map(({ order, contribution }) => ({
      order,
      allocatedExpense: contribution * totalExpenses,
    }));
    console.log("Orders with expenses:", ordersWithExpenses);

    // Calculate profit per month using raw query to avoid TypeORM query builder issues
    const dateFormat = interval === "daily" ? "DATE(created_at)" :
                     interval === "weekly" ? "DATE_FORMAT(created_at, '%Y-%U')" :
                     interval === "monthly" ? "DATE_FORMAT(created_at, '%Y-%m')" :
                     "DATE_FORMAT(created_at, '%Y')";

    const profitOverview = await AppDataSource.manager.query(
      `SELECT ${dateFormat} AS date, SUM(final_price) AS revenue
       FROM orders
       WHERE created_at BETWEEN ? AND ?
       AND status = ?
       GROUP BY ${dateFormat}
       ORDER BY date ASC`,
      [start, end, "completed"]
    );
    console.log("Profit overview:", profitOverview);

    // Calculate expenses per month
    const expenseByMonth = await AppDataSource.manager.query(
      `SELECT ${dateFormat} AS date, SUM(amount) AS expense
       FROM expenses
       WHERE created_at BETWEEN ? AND ?
       GROUP BY ${dateFormat}
       ORDER BY date ASC`,
      [start, end]
    );
    console.log("Expenses by month:", expenseByMonth);

    // Merge revenue and expenses to calculate profit per month
    const profitByMonth = profitOverview.map((entry) => {
      const expenseEntry = expenseByMonth.find((exp) => exp.date === entry.date) || { expense: 0 };
      const profit = (parseFloat(entry.revenue) || 0) - (parseFloat(expenseEntry.expense) || 0);
      return {
        date: entry.date,
        profit: profit > 0 ? profit : 0,
      };
    });
    console.log("Profit by month:", profitByMonth);

    // Total Profit This Month
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthOrders = await orderRepository.find({
      where: {
        created_at: Between(currentMonthStart, currentMonthEnd),
        status: "completed",
      },
    });
    console.log("Current month orders:", currentMonthOrders);

    let currentMonthRevenue = 0;
    for (const order of currentMonthOrders) {
      const finalPrice = parseFloat(order.final_price) || 0;
      if (isNaN(finalPrice)) {
        console.warn(`Invalid final_price for current month order ID ${order.id}: ${order.final_price}`);
      }
      currentMonthRevenue += finalPrice;
    }

    const currentMonthExpenses = await expenseRepository.find({
      where: { created_at: Between(currentMonthStart, currentMonthEnd) },
    });
    console.log("Current month expenses:", currentMonthExpenses);

    const currentMonthTotalExpenses = currentMonthExpenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      if (isNaN(amount)) {
        console.warn(`Invalid amount for current month expense ID ${expense.id}: ${expense.amount}`);
      }
      return sum + amount;
    }, 0);

    const totalProfitThisMonth = currentMonthRevenue - currentMonthTotalExpenses;

    // Highest Profit (max profit in any month)
    const highestProfit = profitByMonth.reduce(
      (max, entry) => Math.max(max, parseFloat(entry.profit) || 0),
      0
    );

    res.json({
      message: "Profits data retrieved successfully",
      data: {
        profit_overview: profitByMonth.map((entry) => ({
          date: entry.date,
          profit: parseFloat(entry.profit || 0).toFixed(2),
        })),
        total_profit_this_month: totalProfitThisMonth > 0 ? totalProfitThisMonth.toFixed(2) : "0.00",
        highest_profit: highestProfit.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error in /profitsdash endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching profits data", error: error.message });
  }
});

// Endpoint 6: Expenses Dashboard Data
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

    // 1. Expenses over time by category
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

    // Transform the data into the desired format
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

    // 2. Total expenses by category
    const expenseCategories = await expenseRepository
      .createQueryBuilder("expense")
      .leftJoin("expense.category", "category")
      .select("category.name", "name")
      .addSelect("SUM(expense.total_amount)", "amount")
      .where("expense.created_at BETWEEN :start AND :end", { start, end })
      .groupBy("category.name")
      .getRawMany();

    // 3. Total expenses this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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
        total_expenses_this_month: parseFloat(totalExpensesThisMonth.total || 0).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error in /expenses endpoint:", error.stack);
    res.status(500).json({ message: "Error fetching expenses data", error: error.message });
  }
});

// Endpoint 7: Orders Dashboard Data
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem); // Assuming an OrderItem entity exists
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

    // 1. Orders over time
    const dateFormat = getDateFormat(interval, "order");
    const ordersOverTime = await orderRepository
      .createQueryBuilder("order")
      .select(dateFormat, "date")
      .addSelect("COUNT(order.id)", "orders")
      .where("order.created_at BETWEEN :start AND :end", { start, end })
      .groupBy(dateFormat)
      .orderBy("date", "ASC")
      .getRawMany();

    // 2. Top-selling products (top 5 by quantity sold)
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

    // 3. Least-selling products (bottom 5 by quantity sold)
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
});

export default router;