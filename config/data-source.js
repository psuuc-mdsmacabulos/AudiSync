import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import User from "../dist/user.js"; 
import Cart from "../dist/cart.js";  
import Product from "../dist/products.js"; 
import Order from "../dist/order.js"; 
import Category from "../dist/category.js";
import Discount from "../dist/discounts.js";
import OrderItem from "../dist/order_item.js";
import Expense from "../dist/expenses.js";
import ExpenseCategory from "../dist/expenseCategory.js";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'), 
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [User, Cart, Product, Order, Category, Discount, OrderItem, Expense, ExpenseCategory],  
    synchronize: true,  
});

AppDataSource.initialize()
    .then(() => {
        console.log("MySQL connected successfully!");
    })
    .catch((err) => {
        console.error("Error connecting to the database:", err);
    });
