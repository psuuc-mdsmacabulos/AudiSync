import { AppDataSource } from "../../config/data-source.js";
import ExpenseCategory from "../../dist/expenseCategory.js";
import { Like } from "typeorm";

export const createExpenseCategory = async (req, res) => {
    try {
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);
        const { name, description } = req.body;

        // Check if category name already exists
        const existingCategory = await categoryRepository.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(400).json({ message: "Category name already exists" });
        }

        const category = new ExpenseCategory();
        category.name = name;
        category.description = description || null;

        const savedCategory = await categoryRepository.save(category);
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(500).json({ message: "Error creating expense category", error: error.message });
    }
};

export const getAllExpenseCategories = async (req, res) => {
    try {
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);

        const pageNumber = Number(req.query.page) || 1;
        const limitNumber = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const [categories, total] = await categoryRepository.findAndCount({
            where: search ? { name: Like(`%${search}%`) } : {},
            take: limitNumber,
            skip: (pageNumber - 1) * limitNumber,
            order: { name: "ASC" },
        });

        res.json({
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            categories,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};

export const getExpenseCategoryById = async (req, res) => {
    try {
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);
        const category = await categoryRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: "Error fetching category", error: error.message });
    }
};

export const updateExpenseCategory = async (req, res) => {
    try {
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);
        const { name, description } = req.body;

        const category = await categoryRepository.findOne({ where: { id: parseInt(req.params.id) } });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Check if new category name already exists
        if (name && name !== category.name) {
            const existingCategory = await categoryRepository.findOne({ where: { name } });
            if (existingCategory) {
                return res.status(400).json({ message: "Category name already exists" });
            }
        }

        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;

        const updatedCategory = await categoryRepository.save(category);
        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
};

export const deleteExpenseCategory = async (req, res) => {
    try {
        const categoryRepository = AppDataSource.getRepository(ExpenseCategory);
        const category = await categoryRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await categoryRepository.remove(category);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
};