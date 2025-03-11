import express from 'express';
import cors from 'cors';
import salesRoutes from './routes/salesRoutes.js'; 
import userRoutes from './routes/userLogin.js'; 
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; 
import cartRoutes from './routes/cartRoutes.js';
import createUser from './routes/createUser.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config(); 

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

app.use("/api", createUser);
app.use("/api/auth", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
