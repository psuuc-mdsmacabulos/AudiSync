import { Router } from "express";
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
router.post("/categories", createSupportCategory);
router.get("/categories", getAllSupportCategories);
router.get("/categories/:id", getSupportCategoryById);
router.put("/categories/:id", updateSupportCategory);
router.delete("/categories/:id", deleteSupportCategory);

// Support Article Routes
router.post("/articles", upload.single("video"), createSupportArticle);
router.get("/articles", getAllSupportArticles);
router.get("/articles/:id", getSupportArticleById);
router.put("/articles/:id", upload.single("video"), updateSupportArticle);
router.delete("/articles/:id", deleteSupportArticle);

// FAQ Routes
router.post("/faqs", createFAQ);
router.get("/faqs", getAllFAQs);
router.get("/faqs/:id", getFAQById);
router.put("/faqs/:id", updateFAQ);
router.delete("/faqs/:id", deleteFAQ);

// Popular Articles Route
router.get("/popular-articles", getPopularArticles);

export default router;