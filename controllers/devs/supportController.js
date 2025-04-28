import { AppDataSource } from "../../config/data-source.js";
import SupportCategory from "../../dist/supportcategory.js";
import SupportArticle from "../../dist/supportArticle.js";
import FAQ from "../../dist/faq.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer setup for video uploads
const uploadDir = path.join(process.cwd(), "uploads", "videos");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only video files (mp4, webm, ogg) are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// SupportCategory CRUD
export const createSupportCategory = async (req, res) => {
    try {
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const { name, description } = req.body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Category name is required and must be a non-empty string" });
        }

        const existingCategory = await supportCategoryRepository.findOne({ where: { name: name.trim() } });
        if (existingCategory) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        const category = new SupportCategory();
        category.name = name.trim();
        category.description = description ? description.trim() : null;
        category.created_by = `${req.user.first_name} ${req.user.last_name}`;

        const savedCategory = await supportCategoryRepository.save(category);
        res.status(201).json({ message: "Support category created successfully", data: savedCategory });
    } catch (error) {
        res.status(500).json({ message: "Error creating support category", error: error.message });
    }
};

export const getAllSupportCategories = async (req, res) => {
    try {
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const categories = await supportCategoryRepository.find();
        res.json({ message: "Support categories retrieved successfully", data: categories });
    } catch (error) {
        res.status(500).json({ message: "Error fetching support categories", error: error.message });
    }
};

export const getSupportCategoryById = async (req, res) => {
    try {
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const category = await supportCategoryRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!category) {
            return res.status(404).json({ message: "Support category not found" });
        }

        res.json({ message: "Support category retrieved successfully", data: category });
    } catch (error) {
        res.status(500).json({ message: "Error fetching support category", error: error.message });
    }
};

export const updateSupportCategory = async (req, res) => {
    try {
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const category = await supportCategoryRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!category) {
            return res.status(404).json({ message: "Support category not found" });
        }

        const { name, description } = req.body;

        if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
            return res.status(400).json({ message: "Category name must be a non-empty string if provided" });
        }

        if (name) {
            const existingCategory = await supportCategoryRepository.findOne({ where: { name: name.trim() } });
            if (existingCategory && existingCategory.id !== category.id) {
                return res.status(400).json({ message: "Category with this name already exists" });
            }
            category.name = name.trim();
        }

        category.description = description !== undefined ? (description ? description.trim() : null) : category.description;
        category.updated_by = `${req.user.first_name} ${req.user.last_name}`;
        category.updated_at = new Date();

        const updatedCategory = await supportCategoryRepository.save(category);
        res.json({ message: "Support category updated successfully", data: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: "Error updating support category", error: error.message });
    }
};

export const deleteSupportCategory = async (req, res) => {
    try {
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const category = await supportCategoryRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!category) {
            return res.status(404).json({ message: "Support category not found" });
        }

        const articlesInCategory = await supportArticleRepository.count({ where: { category: { id: category.id } } });
        if (articlesInCategory > 0) {
            return res.status(400).json({ message: "Cannot delete category with associated articles" });
        }

        await supportCategoryRepository.remove(category);
        res.status(204).json({ message: "Support category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting support category", error: error.message });
    }
};

// SupportArticle CRUD
export const createSupportArticle = async (req, res) => {
    try {
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const { title, content, type, category_id } = req.body;

        if (!title || typeof title !== "string" || title.trim() === "") {
            return res.status(400).json({ message: "Title is required and must be a non-empty string" });
        }
        if (!content || typeof content !== "string" || content.trim() === "") {
            return res.status(400).json({ message: "Content is required and must be a non-empty string" });
        }
        if (!["article", "video"].includes(type)) {
            return res.status(400).json({ message: "Type must be 'article' or 'video'" });
        }
        if (type === "video" && !req.file) {
            return res.status(400).json({ message: "Video file is required for video type" });
        }

        let category = null;
        if (category_id) {
            category = await supportCategoryRepository.findOne({ where: { id: parseInt(category_id) } });
            if (!category) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
        }

        const article = new SupportArticle();
        article.title = title.trim();
        article.content = content.trim();
        article.type = type;
        article.video_url = type === "video" ? `/videos/${req.file.filename}` : null;
        article.category = category;
        article.created_by = `${req.user.first_name} ${req.user.last_name}`;

        const savedArticle = await supportArticleRepository.save(article);
        res.status(201).json({ message: "Support article created successfully", data: savedArticle });
    } catch (error) {
        res.status(500).json({ message: "Error creating support article", error: error.message });
    }
};

export const getAllSupportArticles = async (req, res) => {
    try {
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const { category_id, type, search } = req.query;

        const queryBuilder = supportArticleRepository.createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category");

        if (category_id) {
            queryBuilder.andWhere("article.category_id = :category_id", { category_id: parseInt(category_id) });
        }
        if (type) {
            queryBuilder.andWhere("article.type = :type", { type });
        }
        if (search) {
            queryBuilder.andWhere("article.title LIKE :search OR article.content LIKE :search", { search: `%${search}%` });
        }

        const articles = await queryBuilder.getMany();
        res.json({ message: "Support articles retrieved successfully", data: articles });
    } catch (error) {
        res.status(500).json({ message: "Error fetching support articles", error: error.message });
    }
};

export const getSupportArticleById = async (req, res) => {
    try {
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const article = await supportArticleRepository.findOne({ 
            where: { id: parseInt(req.params.id) },
            relations: ["category"]
        });

        if (!article) {
            return res.status(404).json({ message: "Support article not found" });
        }

        res.json({ message: "Support article retrieved successfully", data: article });
    } catch (error) {
        res.status(500).json({ message: "Error fetching support article", error: error.message });
    }
};

export const updateSupportArticle = async (req, res) => {
    try {
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const supportCategoryRepository = AppDataSource.getRepository(SupportCategory);
        const article = await supportArticleRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!article) {
            return res.status(404).json({ message: "Support article not found" });
        }

        const { title, content, type, category_id } = req.body;

        if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
            return res.status(400).json({ message: "Title must be a non-empty string if provided" });
        }
        if (content !== undefined && (typeof content !== "string" || content.trim() === "")) {
            return res.status(400).json({ message: "Content must be a non-empty string if provided" });
        }
        if (type !== undefined && !["article", "video"].includes(type)) {
            return res.status(400).json({ message: "Type must be 'article' or 'video' if provided" });
        }
        if (type === "video" && !article.video_url && !req.file) {
            return res.status(400).json({ message: "Video file is required for video type if no video exists" });
        }

        if (category_id !== undefined) {
            const category = await supportCategoryRepository.findOne({ where: { id: parseInt(category_id) } });
            if (!category && category_id !== null) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            article.category = category;
        }

        article.title = title ? title.trim() : article.title;
        article.content = content ? content.trim() : article.content;
        article.type = type || article.type;
        article.video_url = type === "video" ? (req.file ? `/videos/${req.file.filename}` : article.video_url) : null;
        article.updated_by = `${req.user.first_name} ${req.user.last_name}`;
        article.updated_at = new Date();

        const updatedArticle = await supportArticleRepository.save(article);
        res.json({ message: "Support article updated successfully", data: updatedArticle });
    } catch (error) {
        res.status(500).json({ message: "Error updating support article", error: error.message });
    }
};

export const deleteSupportArticle = async (req, res) => {
    try {
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const article = await supportArticleRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!article) {
            return res.status(404).json({ message: "Support article not found" });
        }

        // Optionally, delete the video file if it exists
        if (article.video_url) {
            const filePath = path.join(process.cwd(), "uploads", "videos", path.basename(article.video_url));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await supportArticleRepository.remove(article);
        res.status(204).json({ message: "Support article deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting support article", error: error.message });
    }
};

// FAQ CRUD
export const createFAQ = async (req, res) => {
    try {
        const faqRepository = AppDataSource.getRepository(FAQ);
        const { question, answer } = req.body;

        if (!question || typeof question !== "string" || question.trim() === "") {
            return res.status(400).json({ message: "Question is required and must be a non-empty string" });
        }
        if (!answer || typeof answer !== "string" || answer.trim() === "") {
            return res.status(400).json({ message: "Answer is required and must be a non-empty string" });
        }

        const faq = new FAQ();
        faq.question = question.trim();
        faq.answer = answer.trim();
        faq.created_by = `${req.user.first_name} ${req.user.last_name}`;

        const savedFAQ = await faqRepository.save(faq);
        res.status(201).json({ message: "FAQ created successfully", data: savedFAQ });
    } catch (error) {
        res.status(500).json({ message: "Error creating FAQ", error: error.message });
    }
};

export const getAllFAQs = async (req, res) => {
    try {
        const faqRepository = AppDataSource.getRepository(FAQ);
        const { search } = req.query;

        const queryBuilder = faqRepository.createQueryBuilder("faq");

        if (search) {
            queryBuilder.where("faq.question LIKE :search OR faq.answer LIKE :search", { search: `%${search}%` });
        }

        const faqs = await queryBuilder.getMany();
        res.json({ message: "FAQs retrieved successfully", data: faqs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching FAQs", error: error.message });
    }
};

export const getFAQById = async (req, res) => {
    try {
        const faqRepository = AppDataSource.getRepository(FAQ);
        const faq = await faqRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        res.json({ message: "FAQ retrieved successfully", data: faq });
    } catch (error) {
        res.status(500).json({ message: "Error fetching FAQ", error: error.message });
    }
};

export const updateFAQ = async (req, res) => {
    try {
        const faqRepository = AppDataSource.getRepository(FAQ);
        const faq = await faqRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        const { question, answer } = req.body;

        if (question !== undefined && (typeof question !== "string" || question.trim() === "")) {
            return res.status(400).json({ message: "Question must be a non-empty string if provided" });
        }
        if (answer !== undefined && (typeof answer !== "string" || answer.trim() === "")) {
            return res.status(400).json({ message: "Answer must be a non-empty string if provided" });
        }

        faq.question = question ? question.trim() : faq.question;
        faq.answer = answer ? answer.trim() : faq.answer;
        faq.updated_by = `${req.user.first_name} ${req.user.last_name}`;
        faq.updated_at = new Date();

        const updatedFAQ = await faqRepository.save(faq);
        res.json({ message: "FAQ updated successfully", data: updatedFAQ });
    } catch (error) {
        res.status(500).json({ message: "Error updating FAQ", error: error.message });
    }
};

export const deleteFAQ = async (req, res) => {
    try {
        const faqRepository = AppDataSource.getRepository(FAQ);
        const faq = await faqRepository.findOne({ where: { id: parseInt(req.params.id) } });

        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        await faqRepository.remove(faq);
        res.status(204).json({ message: "FAQ deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting FAQ", error: error.message });
    }
};

// Endpoint for Popular Articles
export const getPopularArticles = async (req, res) => {
    try {
        const supportArticleRepository = AppDataSource.getRepository(SupportArticle);
        const articles = await supportArticleRepository.find({
            relations: ["category"],
            order: { created_at: "DESC" },
            take: 5
        });

        res.json({ message: "Popular articles retrieved successfully", data: articles });
    } catch (error) {
        res.status(500).json({ message: "Error fetching popular articles", error: error.message });
    }
};