import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
    createExpenseCategory,
    getAllExpenseCategories,
    getExpenseCategoryById,
    updateExpenseCategory,
    deleteExpenseCategory,
} from "../../controllers/staff/expenseCategoryController.js";

const router = express.Router();

router.post("/", authMiddleware, createExpenseCategory);

router.get("/", authMiddleware, getAllExpenseCategories);

router.get("/:id", authMiddleware, getExpenseCategoryById);

router.put("/:id", authMiddleware, updateExpenseCategory);

router.delete("/:id", authMiddleware, deleteExpenseCategory);

export default router;

//