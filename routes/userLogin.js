import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source.js";
import User from "../dist/user.js";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

// Generate Access Token 
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, first_name: user.first_name, last_name: user.last_name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } 
    );
};

// Generate Refresh Token 
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" } 
    );
};

// USER LOGIN ROUTE 
router.post("/login", async (req, res) => {
    const { first_name, last_name, password } = req.body;

    if (!first_name || !last_name || !password) {
        return res.status(400).json({ message: "First name, last name, and password are required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { first_name, last_name } });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user);

        res.json({
            message: "Login successful",
            accessToken,
            expiresIn: 3600, 
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

// REFRESH TOKEN ROUTE 
router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        // Generate a new refresh token and store in cookie
        const newRefreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken, 
            expiresIn: 3600, 
        });
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});

// LOGOUT ROUTE 
router.post("/logout", (req, res) => {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
});

export default router;
