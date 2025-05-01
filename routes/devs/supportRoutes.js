import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import {
    createSupportCategory,
    getAllSupportCategories,
    getSupportCategoryById,
    updateSupportCategory,
    deleteSupportCategory,
    createSupportArticle,
    getAllSupportArticles,
    getSupportArticleById,
    updateSupportArticle,
    deleteSupportArticle,
    createFAQ,
    getAllFAQs,
    getFAQById,
    updateFAQ,
    deleteFAQ,
    getPopularArticles,
    upload
} from "../../controllers/devs/supportController.js";

const router = Router();

// Support Category Routes
router.post("/categories", authMiddleware, createSupportCategory);
router.get("/categories", authMiddleware, getAllSupportCategories);
router.get("/categories/:id", authMiddleware, getSupportCategoryById);
router.put("/categories/:id", authMiddleware, updateSupportCategory);
router.delete("/categories/:id", authMiddleware, deleteSupportCategory);

// Support Article Routes
router.post("/articles", authMiddleware, upload.single("video"), createSupportArticle);
router.get("/articles", authMiddleware, getAllSupportArticles);
router.get("/articles/:id", authMiddleware, getSupportArticleById);
router.put("/articles/:id", authMiddleware, upload.single("video"), updateSupportArticle);
router.delete("/articles/:id", authMiddleware, deleteSupportArticle);

// FAQ Routes
router.post("/faqs", authMiddleware, createFAQ);
router.get("/faqs", authMiddleware, getAllFAQs);
router.get("/faqs/:id", authMiddleware, getFAQById);
router.put("/faqs/:id", authMiddleware, updateFAQ);
router.delete("/faqs/:id", authMiddleware, deleteFAQ);

// Popular Articles Route
router.get("/popular-articles", authMiddleware, getPopularArticles);

export default router;

//