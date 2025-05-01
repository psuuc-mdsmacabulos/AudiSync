import { Router } from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import jwt from "jsonwebtoken";
import {
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getProfile,
  updateName,
  updateEmail,
  changePassword,
  uploadAvatar,
} from "../controllers/userController.js"; 

dotenv.config();

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

// Multer setup for avatar uploads
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
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.accessToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    console.warn("No token provided in request");
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      console.warn("Invalid token payload:", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);
router.put("/update/name", authenticateToken, updateName);
router.put("/update/email", authenticateToken, updateEmail);
router.put("/change-password", authenticateToken, changePassword);
router.post(
  "/upload-avatar",
  authenticateToken,
  upload.single("image"),
  uploadAvatar
);

export default router;