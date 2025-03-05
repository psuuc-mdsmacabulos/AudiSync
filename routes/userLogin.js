import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from '../config/data-source.js'; 
import User from "../dist/user.js";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

// JWT Token Generation
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, name: `${user.first_name} ${user.last_name}`, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

// Login Route
router.post("/login", async (req, res) => {
    const { first_name, last_name, password } = req.body;

    // Validate input
    if (!first_name || !last_name || !password) {
        return res.status(400).json({ message: "First name, last name, and password are required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { first_name, last_name } });

        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare database hashed password 
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set HTTP-only cookie for refresh token
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Refresh Token Route
router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken; 

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        // Fetch user data using decoded userId
        const newAccessToken = generateAccessToken({ 
            id: decoded.userId, 
            first_name: decoded.first_name, 
            last_name: decoded.last_name, 
            role: decoded.role 
        });

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});

// Logout Route
router.post("/logout", (req, res) => {
    res.clearCookie("refreshToken"); 
    res.json({ message: "Logged out successfully" });
});

export default router;
