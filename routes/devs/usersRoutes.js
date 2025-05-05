// controllers/usersRoutes.js
import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import usersController from "../../controllers/devs/usersController.js";

const router = express.Router();

// Routes
router.get("/users", authMiddleware, usersController.getUsers);
router.put("/users/:id/deactivate", authMiddleware, usersController.deactivateUser);
router.put("/users/:id/activate", authMiddleware, usersController.activateUser);
router.put("/users/:id/soft-delete", authMiddleware, usersController.softDeleteUser);
router.put('/users/:id', usersController.updateUser);

export default router;