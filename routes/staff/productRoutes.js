import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
    createCategory,
    createProduct,
    addDiscountToProduct,
    updateCategory,
    updateProduct,
    toggleProductStatus,
    getAllProducts,
    getDeletedProducts,
    getActiveProducts,
    getInactiveProducts,
    getAllCategories,
    getProductsByCategory,
    getProductById,
    softDeleteProduct,
    deleteCategory,
    restoreProduct,
    uploadMiddleware,
} from "../../controllers/staff/productController.js";

const router = express.Router();

router.post("/categories", authMiddleware, createCategory);

router.post("/", uploadMiddleware, createProduct);

router.post("/:id/discount", authMiddleware, addDiscountToProduct);

router.put("/categories/:id", authMiddleware, updateCategory);

router.put("/update/:id", authMiddleware, uploadMiddleware, updateProduct);

router.put("/toggle-active/:id", authMiddleware, toggleProductStatus);

router.get("/", getAllProducts);

router.get("/deleted", getDeletedProducts);

router.get("/active", getActiveProducts);

router.get("/inactive", getInactiveProducts);

router.get("/categories", getAllCategories);

router.get("/category/:category_id", getProductsByCategory);

router.get("/:id", getProductById);

router.delete("/:id", authMiddleware, softDeleteProduct);

router.delete("/categories/:id", authMiddleware, deleteCategory);

router.put("/restore/:id", restoreProduct);

export default router;