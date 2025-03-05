import "reflect-metadata";
import { DataSource } from "typeorm";
import User from "../dist/user.js";  
import Sale from "../dist/sale.js";  
import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [User, Sale],
    synchronize: true, 
});

AppDataSource.initialize()
    .then(() => {
        console.log("PostgreSQL connected successfully!");
    })
    .catch((err) => {
        console.error("Error connecting to the database:", err);
    });
