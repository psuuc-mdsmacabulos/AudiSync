import express from 'express';
import cors from 'cors';
import salesRoutes from './routes/salesManipulation.js'; 
import userRoutes from './routes/userLogin.js';  
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config(); 

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());


app.use("/api/sales", salesRoutes);
app.use("/api/auth", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
