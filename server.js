import express from "express";
import cors from "cors";
import salesRoutes from "./routes/salesRoutes.js";
import userRoutes from "./routes/userLogin.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import createUser from "./routes/createUser.js";
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
app.use('/uploads', express.static(path.join('public', 'uploads')));


const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});
