import express from "express";
import { AppDataSource } from "../../config/data-source.js";
import Expense from "../../dist/expenses.js";
import ExpenseCategory from "../../dist/expenseCategory.js";
import User from "../../dist/user.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { Between } from "typeorm";

const router = express.Router();

// Create an expense
router.post("/", authMiddleware, async (req, res) => {
    try {
        const expenseRepository = AppDataSource.getRepository(Expense);
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);
        const userRepository = AppDataSource.getRepository(User);

        const {
            description,
            amount,
            quantity,
            tax_amount,
            invoice_number,
            notes,
            status,
            payment_status,
            payment_method,
            vendor,
            is_recurring,
            recurrence_interval,
            pos_transaction_id,
            category_id,
        } = req.body;

        // Validate required fields
        if (!description) {
            return res.status(400).json({ message: "Description is required" });
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }
        if (!["cash", "credit_card", "bank_transfer", "check"].includes(payment_method)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }
        if (is_recurring && !["daily", "weekly", "monthly", "yearly"].includes(recurrence_interval)) {
            return res.status(400).json({ message: "Invalid recurrence interval" });
        }
        if (quantity !== undefined && (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0)) {
            return res.status(400).json({ message: "Quantity must be a positive integer" });
        }
        if (tax_amount !== undefined && (isNaN(parseFloat(tax_amount)) || parseFloat(tax_amount) < 0)) {
            return res.status(400).json({ message: "Tax amount must be a non-negative number" });
        }
        if (status && !["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        if (payment_status && !["pending", "paid", "overdue"].includes(payment_status)) {
            return res.status(400).json({ message: "Invalid payment status" });
        }

        // Get the authenticated user
        const user = await userRepository.findOne({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ message: "Authenticated user not found" });
        }

        const expense = new Expense();
        expense.description = description;
        expense.amount = parseFloat(amount);
        expense.quantity = quantity ? parseInt(quantity) : null;
        expense.tax_amount = tax_amount ? parseFloat(tax_amount) : 0;
        expense.total_amount = expense.amount + (expense.tax_amount || 0);
        expense.invoice_number = invoice_number || null;
        expense.notes = notes || null;
        expense.status = status || "pending";
        expense.payment_status = payment_status || "pending";
        expense.payment_method = payment_method;
        expense.vendor = vendor || null;
        expense.is_recurring = is_recurring || false;
        expense.recurrence_interval = is_recurring ? recurrence_interval : null;
        expense.pos_transaction_id = pos_transaction_id || null;
        expense.recorded_by = user;
        // created_at and updated_at are set in the Expense constructor

        if (category_id) {
            const category = await categoryRepository.findOne({ where: { id: parseInt(category_id) } });
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            expense.category = category;
        }

        const savedExpense = await expenseRepository.save(expense);
        res.status(201).json({ message: "Expense created successfully", data: savedExpense });
    } catch (error) {
        res.status(500).json({ message: "Error creating expense", error: error.message });
    }
});

// Get all expenses with optional filters
router.get("/", authMiddleware, async (req, res) => {
    try {
        const expenseRepository = AppDataSource.getRepository(Expense);

        const { category_id, start_date, end_date, status, payment_status } = req.query;

        const query = {};
        if (category_id) {
            query.category = { id: parseInt(category_id) };
        }
        if (start_date && end_date) {
            query.created_at = Between(new Date(start_date), new Date(end_date));
        }
        if (status) {
            query.status = status;
        }
        if (payment_status) {
            query.payment_status = payment_status;
        }

        const expenses = await expenseRepository.find({
            where: query,
            relations: ["category", "recorded_by"],
        });

        res.json({ message: "Expenses retrieved successfully", data: expenses });
    } catch (error) {
        res.status(500).json({ message: "Error fetching expenses", error: error.message });
    }
});

// Get a single expense by ID
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const expenseRepository = AppDataSource.getRepository(Expense);
        const expense = await expenseRepository.findOne({
            where: { id: parseInt(req.params.id) },
            relations: ["category", "recorded_by"],
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.json({ message: "Expense retrieved successfully", data: expense });
    } catch (error) {
        res.status(500).json({ message: "Error fetching expense", error: error.message });
    }
});

// Update an expense
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const expenseRepository = AppDataSource.getRepository(Expense);
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);

        const expense = await expenseRepository.findOne({ where: { id: parseInt(req.params.id) } });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const {
            description,
            amount,
            quantity,
            tax_amount,
            invoice_number,
            notes,
            status,
            payment_status,
            payment_method,
            vendor,
            is_recurring,
            recurrence_interval,
            pos_transaction_id,
            category_id,
        } = req.body;

        // Validate updated fields
        if (description !== undefined && !description) {
            return res.status(400).json({ message: "Description cannot be empty" });
        }
        if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }
        if (quantity !== undefined && quantity !== null && (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0)) {
            return res.status(400).json({ message: "Quantity must be a positive integer" });
        }
        if (tax_amount !== undefined && (isNaN(parseFloat(tax_amount)) || parseFloat(tax_amount) < 0)) {
            return res.status(400).json({ message: "Tax amount must be a non-negative number" });
        }
        if (payment_method && !["cash", "credit_card", "bank_transfer", "check"].includes(payment_method)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }
        if (is_recurring !== undefined && is_recurring && !["daily", "weekly", "monthly", "yearly"].includes(recurrence_interval)) {
            return res.status(400).json({ message: "Invalid recurrence interval" });
        }
        if (status && !["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        if (payment_status && !["pending", "paid", "overdue"].includes(payment_status)) {
            return res.status(400).json({ message: "Invalid payment status" });
        }

        // Update fields if provided
        expense.description = description || expense.description;
        expense.amount = amount ? parseFloat(amount) : expense.amount;
        expense.quantity = quantity !== undefined ? (quantity ? parseInt(quantity) : null) : expense.quantity;
        expense.tax_amount = tax_amount !== undefined ? (tax_amount ? parseFloat(tax_amount) : 0) : expense.tax_amount;
        expense.total_amount = (amount ? parseFloat(amount) : expense.amount) + (tax_amount !== undefined ? (tax_amount ? parseFloat(tax_amount) : 0) : expense.tax_amount);
        expense.invoice_number = invoice_number !== undefined ? invoice_number : expense.invoice_number;
        expense.notes = notes !== undefined ? notes : expense.notes;
        expense.status = status || expense.status;
        expense.payment_status = payment_status || expense.payment_status;
        expense.payment_method = payment_method || expense.payment_method;
        expense.vendor = vendor !== undefined ? vendor : expense.vendor;
        expense.is_recurring = is_recurring !== undefined ? is_recurring : expense.is_recurring;
        expense.recurrence_interval = is_recurring !== undefined ? (is_recurring ? recurrence_interval : null) : expense.recurrence_interval;
        expense.pos_transaction_id = pos_transaction_id !== undefined ? pos_transaction_id : expense.pos_transaction_id;
        expense.updated_at = new Date(); // Manually update updated_at

        if (category_id !== undefined) {
            const category = await categoryRepository.findOne({ where: { id: parseInt(category_id) } });
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            expense.category = category;
        }

        const updatedExpense = await expenseRepository.save(expense);
        res.json({ message: "Expense updated successfully", data: updatedExpense });
    } catch (error) {
        res.status(500).json({ message: "Error updating expense", error: error.message });
    }
});

// Delete an expense
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const expenseRepository = AppDataSource.getRepository(Expense);
        const expense = await expenseRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        await expenseRepository.remove(expense);
        res.status(204).json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting expense", error: error.message });
    }
});

export default router;