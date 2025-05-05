import express from "express";
import cors from "cors";

// Staff Routes 
import salesRoutes from "./routes/staff/salesRoutes.js";
import userRoutes from "./routes/userLogin.js";
import productRoutes from "./routes/staff/productRoutes.js";
import orderRoutes from "./routes/staff/orderRoutes.js";
import cartRoutes from "./routes/staff/cartRoutes.js";
import discountRoutes from "./routes/staff/discountRoutes.js";
import expensesRoutes from "./routes/staff/expensesRoutes.js";
import expensesCategoryRoutes from "./routes/staff/expensesCategoryRoutes.js";

// Admin Routes
import createUser from "./routes/admin/createUser.js";
import analyticRoutes from "./routes/admin/analyticRoutes.js";
import auditRoutes from "./routes/admin/auditRoutes.js";

// Dev Routes
import supportRoutes from "./routes/devs/supportRoutes.js";
import usersRoutes from "./routes/devs/usersRoutes.js";

import bodyParser from "body-parser";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import "./config/jobs/removeExpiredDiscounts.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app = express();

dotenv.config(); 

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api", createUser);
app.use("/api/auth", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/expensescategory", expensesCategoryRoutes);
app.use("/api/analytics", analyticRoutes);
app.use("/api/support", supportRoutes);
app.use("/api", usersRoutes);
app.use("/api/audit", auditRoutes);
app.use('/uploads', express.static(path.join('public', 'uploads')));
app.use("/videos", express.static(path.join(process.cwd(), "uploads", "videos")));


const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});

//
