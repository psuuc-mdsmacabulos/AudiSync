import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
} from "../../controllers/staff/expenseController.js";

const router = express.Router();

router.post("/", authMiddleware, createExpense);

router.get("/", authMiddleware, getAllExpenses);

router.get("/:id", authMiddleware, getExpenseById);

router.put("/:id", authMiddleware, updateExpense);

router.delete("/:id", authMiddleware, deleteExpense);

export default router;