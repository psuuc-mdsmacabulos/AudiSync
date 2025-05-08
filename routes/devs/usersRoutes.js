import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import usersController from "../../controllers/devs/usersController.js";

const router = express.Router();

// Routes
router.get("/users/", authMiddleware, usersController.getUsers);
router.get("/users/soft-deleted", authMiddleware, usersController.getSoftDeletedUsers); 
router.put("/users/:id/deactivate", authMiddleware, usersController.deactivateUser);
router.put("/users/:id/activate", authMiddleware, usersController.activateUser);
router.put("/users/:id/soft-delete", authMiddleware, usersController.softDeleteUser);
router.put("/users/:id", authMiddleware, usersController.updateUser); 
router.put("/users/:id/restore", authMiddleware, usersController.restoreUser);

export default router;