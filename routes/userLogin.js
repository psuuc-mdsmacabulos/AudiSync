import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source.js";
import User from "../dist/user.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

// ✅ Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, first_name: user.first_name, last_name: user.last_name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};

// ✅ Generate Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

// ✅ Generate Reset Token
const generateResetToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
};

// ✅ LOGIN ROUTE
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ FORGOT PASSWORD ROUTE
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        // ✅ Generate reset token (valid for 15 minutes)
        const resetToken = generateResetToken(user);

        // ✅ Store token in a secure cookie
        res.cookie("resetToken", resetToken, {
            httpOnly: true,
            secure: isProduction, // Use HTTPS in production
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <h1>Password Reset</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}" target="_blank">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
            `,
        });

        res.json({ message: "Password reset link sent to your email" });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ RESET PASSWORD ROUTE
router.post("/reset-password", async (req, res) => {
    const { newPassword } = req.body;
    const resetToken = req.cookies.resetToken;

    if (!resetToken || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
    }

    try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // ✅ Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await userRepository.save(user);

        // ✅ Clear the reset token cookie after use
        res.clearCookie("resetToken");

        res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(400).json({ message: "Invalid or expired token" });
    }
});

// REFRESH TOKEN ROUTE 
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

        if (!user) {
            return res.status(401).json({ message: "User not found. Please log in again." });
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        // Send new access token
        res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
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
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});

// ✅ LOGOUT ROUTE
router.post("/logout", (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
