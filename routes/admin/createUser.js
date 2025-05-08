import { Router } from "express";
import { registerUser } from "../../controllers/admin/createuserController.js";

const router = Router();

// CREATE USER ROUTE
router.post("/register", registerUser);

export default router;
