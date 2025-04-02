import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source.js";
import User from "../dist/user.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";

dotenv.config();

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/avatars");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("Only images (jpeg, jpg, png) are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, first_name: user.first_name, last_name: user.last_name, role: user.role },
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

const generateResetToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
};

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
            maxAge: 60 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
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

        const resetToken = generateResetToken(user);

        res.cookie("resetToken", resetToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 15 * 60 * 1000,
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

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await userRepository.save(user);

        res.clearCookie("resetToken");

        res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(400).json({ message: "Invalid or expired token" });
    }
});

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
            return res.status(401).json({ message: "User not found. Please log in again." });
        }

        const newAccessToken = generateAccessToken(user);

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

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            avatar: user.avatar || null,
            role: user.role,
        });
    } catch (err) {
        console.error("Get profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/name", authenticateToken, async (req, res) => {
    const { name } = req.body;

    // Validate name
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required and cannot be empty" });
    }

    // Split the name into parts
    const nameParts = name.trim().split(/\s+/); // Split by any whitespace (handles multiple spaces)

    // Ensure there is at least a first name
    if (nameParts.length === 0 || nameParts[0].length === 0) {
        return res.status(400).json({ message: "First name is required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Determine first_name and last_name
        let first_name, last_name;

        if (nameParts.length === 1) {
            // Only first name provided (e.g., "John")
            first_name = nameParts[0];
            last_name = "";
        } else if (nameParts.length === 2) {
            // First name with one word and a last name (e.g., "John Smith")
            first_name = nameParts[0];
            last_name = nameParts[1];
        } else if (nameParts.length === 3) {
            // First name with two words and a last name (e.g., "John Paul Smith")
            first_name = `${nameParts[0]} ${nameParts[1]}`; // Combine first two words as first_name
            last_name = nameParts[2];
        } else {
            // More than three words (e.g., "John Paul Smith Jr")
            first_name = `${nameParts[0]} ${nameParts[1]}`; // First two words as first_name
            last_name = nameParts.slice(2).join(" "); // Everything else as last_name
        }

        // Check if the name is actually different
        const currentName = `${user.first_name} ${user.last_name || ""}`.trim();
        const newName = `${first_name} ${last_name}`.trim();

        if (currentName === newName) {
            return res.status(200).json({ message: "No changes made to name" });
        }

        // Update user fields
        user.first_name = first_name;
        user.last_name = last_name || ""; // Set to empty string if no last name

        await userRepository.save(user);

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/email", authenticateToken, async (req, res) => {
    const { email } = req.body;

    // Validate email presence
    if (!email || email.trim().length === 0) {
        return res.status(400).json({ message: "Email is required and cannot be empty" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the email is actually different
        if (user.email === email.trim()) {
            return res.status(200).json({ message: "No changes made to email" });
        }

        user.email = email.trim();

        await userRepository.save(user);

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/change-password", authenticateToken, async (req, res) => {
    const { current, new: newPassword } = req.body;

    // Validate presence of current and new password
    if (!current || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message:
                "New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
        });
    }

    // Check if current and new password are the same
    if (current === newPassword) {
        return res.status(400).json({ message: "New password must be different from the current password" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(current, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await userRepository.save(user);

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/upload-avatar", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.avatar = `/uploads/avatars/${req.file.filename}`;
        await userRepository.save(user);

        res.json({ message: "Profile image updated successfully", avatar: user.avatar });
    } catch (err) {
        console.error("Upload avatar error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;