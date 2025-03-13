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
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,  
            sameSite: "None", 
            path: "/",
            maxAge: 60 * 60 * 1000, 
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "None",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.json({
            message: "Login successful",
            accessToken,
            expiresIn: 3600, 
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// REFRESH TOKEN ROUTE - Generate a new access token but keep the user logged in
router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        // Fetch user from database
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });

        // If user is not found, reject refresh
        if (!user) {
            return res.status(401).json({ message: "User not found. Please log in again." });
        }

        // Generate a new access token (but DON'T replace the refresh token)
        const newAccessToken = generateAccessToken(user);

        // Send the new access token without changing the refresh token
        res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            expiresIn: "1h", 
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});

// LOGOUT ROUTE 
router.post("/logout", (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
});

export default router;
