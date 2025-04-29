import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
} from "../../controllers/staff/discountController.js";

const router = express.Router();

router.get("/", authMiddleware, getAllDiscounts);

router.get("/:id", authMiddleware, getDiscountById);

router.post("/", authMiddleware, createDiscount);

router.put("/:id", authMiddleware, updateDiscount);

router.patch("/:id/status", authMiddleware, toggleDiscountStatus);

export default router;

//