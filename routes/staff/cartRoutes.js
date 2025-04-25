import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import { getCart, addToCart, removeFromCart, checkout } from "../../controllers/staff/cartController.js";

const router = express.Router();

router.get("/", authMiddleware, getCart);

router.post("/add", addToCart);

router.delete("/remove/:cartItemId", authMiddleware, removeFromCart);

router.post("/checkout", authMiddleware, checkout);

export default router;