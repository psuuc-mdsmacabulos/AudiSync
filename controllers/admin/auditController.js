import { AppDataSource } from "../../config/data-source.js";
import { In, ILike } from "typeorm";
import Product from "../../dist/products.js";
import SupportArticle from "../../dist/supportArticle.js";
import User from "../../dist/user.js";
import AccountLog from "../../dist/accountLog.js";
import Expense from "../../dist/expenses.js";

// Helper function to fetch user full name from email, user object, or fallback to req.user
const fetchUserFullName = async (userOrEmail, fallbackUser) => {
    if (!userOrEmail && !fallbackUser) {
        return "Unknown User";
    }

    // If userOrEmail is a user object (e.g., from a relation like recorded_by)
    if (userOrEmail && typeof userOrEmail === "object" && userOrEmail.first_name && userOrEmail.last_name) {
        return `${userOrEmail.first_name} ${userOrEmail.last_name}`;
    }

    // If userOrEmail is an email string
    if (typeof userOrEmail === "string") {
        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { email: userOrEmail } });
            if (user) {
                return `${user.first_name} ${user.last_name}`;
            }
        } catch (error) {
            console.error(`Error fetching user by email ${userOrEmail}:`, error.message);
        }
    }

    // Fallback to req.user if provided
    if (fallbackUser) {
        return `${fallbackUser.first_name} ${fallbackUser.last_name}`;
    }

    return "Unknown User";
};

// Helper function to safely format date
const formatDate = (date, context = "unknown") => {
    console.log(`Raw date value in ${context}:`, date, typeof date);
    if (!date) {
        console.warn(`Invalid date (null/undefined) in ${context}`);
        return null;
    }
    let parsedDate;
    if (typeof date === "string") {
        parsedDate = new Date(date);
    } else if (date instanceof Date) {
        parsedDate = date;
    } else {
        console.warn(`Invalid date type in ${context}: ${typeof date}`);
        return null;
    }
    if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date (NaN) in ${context}: ${date}`);
        return null;
    }
    return parsedDate.toISOString();
};

const getAuditLogs = async (req, res) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const userRepository = AppDataSource.getRepository(User);
        const expenseRepository = AppDataSource.getRepository(Expense);

        const [products, supportArticles, users, expenses] = await Promise.all([
            productRepository.find({ order: { created_at: "DESC" }, take: 50 }),
            supportArticleRepository.find({ order: { created_at: "DESC" }, take: 50 }),
            userRepository.find({ order: { created_at: "DESC" }, take: 50 }),
            expenseRepository.find({ 
                order: { created_at: "DESC" }, 
                take: 50, 
                relations: ["recorded_by"]
            })
        ]);

        const productLogs = (await Promise.all(
            products.map(async product => {
                const createdDate = formatDate(product.created_at, `Product created_at (ID: ${product.id})`);
                const updatedDate = formatDate(product.updated_at, `Product updated_at (ID: ${product.id})`);
                const deletedDate = formatDate(product.deleted_at, `Product deleted_at (ID: ${product.id})`);
                if (!createdDate) return [];
                return [
                    {
                        date_time: createdDate,
                        user: await fetchUserFullName(null, req.user),
                        action: "Created",
                        category: "Product",
                        details: `Name: ${product.name || "N/A"}`
                    },
                    updatedDate && updatedDate !== createdDate ? {
                        date_time: updatedDate,
                        user: await fetchUserFullName(product.updated_by, req.user),
                        action: "Updated",
                        category: "Product",
                        details: `Name: ${product.name || "N/A"}`
                    } : null,
                    deletedDate ? {
                        date_time: deletedDate,
                        user: await fetchUserFullName(product.deleted_by, req.user),
                        action: "Deleted",
                        category: "Product",
                        details: `Name: ${product.name || "N/A"}`
                    } : null
                ].filter(log => log);
            })
        )).flat();

        const supportArticleLogs = (await Promise.all(
            supportArticles.map(async article => {
                const createdDate = formatDate(article.created_at, `SupportArticle created_at (ID: ${article.id})`);
                const updatedDate = formatDate(article.updated_at, `SupportArticle updated_at (ID: ${article.id})`);
                if (!createdDate) return [];
                return [
                    {
                        date_time: createdDate,
                        user: await fetchUserFullName(article.created_by, req.user),
                        action: "Created",
                        category: "SupportArticle",
                        details: `Title: ${article.title || "N/A"}`
                    },
                    updatedDate && updatedDate !== createdDate ? {
                        date_time: updatedDate,
                        user: await fetchUserFullName(article.updated_by, req.user),
                        action: "Updated",
                        category: "SupportArticle",
                        details: `Title: ${article.title || "N/A"}`
                    } : null
                ].filter(log => log);
            })
        )).flat();

        const userLogs = (await Promise.all(
            users.map(async user => {
                const createdDate = formatDate(user.created_at, `User created_at (ID: ${user.id})`);
                const updatedDate = formatDate(user.updated_at, `User updated_at (ID: ${user.id})`);
                const deletedDate = formatDate(user.deleted_at, `User deleted_at (ID: ${user.id})`);
                if (!createdDate) return [];
                return [
                    {
                        date_time: createdDate,
                        user: "System",
                        action: "Created",
                        category: "User",
                        details: `Email: ${user.email || "N/A"}`
                    },
                    updatedDate && updatedDate !== createdDate ? {
                        date_time: updatedDate,
                        user: await fetchUserFullName(null, req.user),
                        action: "Updated",
                        category: "User",
                        details: `Email: ${user.email || "N/A"}`
                    } : null,
                    deletedDate ? {
                        date_time: deletedDate,
                        user: await fetchUserFullName(null, req.user),
                        action: "Deleted",
                        category: "User",
                        details: `Email: ${user.email || "N/A"}`
                    } : null
                ].filter(log => log);
            })
        )).flat();

        const expenseLogs = (await Promise.all(
            expenses.map(async expense => {
                const createdDate = formatDate(expense.created_at, `Expense created_at (ID: ${expense.id})`);
                const updatedDate = formatDate(expense.updated_at, `Expense updated_at (ID: ${expense.id})`);
                if (!createdDate) return [];
                return [
                    {
                        date_time: createdDate,
                        user: await fetchUserFullName(expense.recorded_by, req.user),
                        action: "Created",
                        category: "Expense",
                        details: `Description: ${expense.description || "N/A"}, Amount: ${expense.total_amount}`
                    },
                    updatedDate && updatedDate !== createdDate ? {
                        date_time: updatedDate,
                        user: await fetchUserFullName(expense.recorded_by, req.user),
                        action: "Updated",
                        category: "Expense",
                        details: `Description: ${expense.description || "N/A"}, Amount: ${expense.total_amount}`
                    } : null
                ].filter(log => log);
            })
        )).flat();

        const allLogs = [
            ...productLogs,
            ...supportArticleLogs,
            ...userLogs,
            ...expenseLogs
        ].sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

        const formattedLogs = allLogs.slice(0, 10);

        console.log("Formatted Audit Logs:", formattedLogs);

        return res.status(200).json(formattedLogs);
    } catch (error) {
        console.error("Error fetching audit logs:", error.message);
        return res.status(500).json({ 
            message: "Failed to fetch audit logs", 
            error: error.message,
            stack: error.stack
        });
    }
};

const getAccountLogs = async (req, res) => {
    try {
        const accountLogRepository = AppDataSource.getRepository(AccountLog);

        const accountLogs = await accountLogRepository.find({
            where: [
                { action: ILike("%logged in%") },
                { action: ILike("%logged out%") },
                { action: ILike("%login%") },
                { action: ILike("%logout%") }
            ],
            relations: ["performed_by"],
            order: { created_at: "DESC" },
            take: 10
        });

        console.log("Raw Account Logs:", accountLogs);

        const formattedLogs = accountLogs.map(log => {
            const dateTime = formatDate(log.created_at, `AccountLog created_at (ID: ${log.id})`);
            if (!dateTime) return null;
            return {
                date_time: dateTime,
                performed_by: log.performed_by ? `${log.performed_by.first_name} ${log.performed_by.last_name}` : (req.user ? `${req.user.first_name} ${req.user.last_name}` : "Unknown User"),
                action: log.action,
                details: log.details || "-"
            };
        }).filter(log => log);

        console.log("Formatted Account Logs:", formattedLogs);

        return res.status(200).json(formattedLogs);
    } catch (error) {
        console.error("Error fetching account logs:", error.message);
        return res.status(500).json({ 
            message: "Failed to fetch account logs", 
            error: error.message,
            stack: error.stack
        });
    }
};

export { getAuditLogs, getAccountLogs };