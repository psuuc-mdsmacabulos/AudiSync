// controllers/usersController.js
import { AppDataSource } from "../../config/data-source.js";
import User from "../../dist/user.js";

const userRepository = AppDataSource.getRepository(User);

export default {
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      const [users, total] = await userRepository.findAndCount({
        where: { deleted_at: null, is_active: true }, // Fetch only non-deleted and active users
        relations: ["carts", "expenses"], // Optional: load related data if needed
        skip,
        take: limit,
      });

      res.json({
        data: users.map(user => ({
          userId: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email, // Add email field
          role: user.role,
          status: user.is_active ? "Active" : "Inactive",
          action: user.is_active ? "Deactivate" : "Activate",
          canSoftDelete: !user.deleted_at, // Indicate if soft delete is available
        })),
        total,
        page,
        last_page: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Other methods (deactivateUser, activateUser, softDeleteUser) remain unchanged
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      user.is_active = false;
      await userRepository.save(user);

      res.json({ message: "User deactivated successfully", user: { id: user.id, status: "Inactive" } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      user.is_active = true;
      await userRepository.save(user);

      res.json({ message: "User activated successfully", user: { id: user.id, status: "Active" } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async softDeleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      user.deleted_at = new Date();
      await userRepository.save(user);

      res.json({ message: "User soft-deleted successfully", user: { id: user.id, status: "Soft Deleted" } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Add updateUser method (if not already added from previous response)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      const [first_name, last_name] = name.split(' ').filter(Boolean);
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
      user.email = email || user.email;
      user.role = role || user.role;

      await userRepository.save(user);
      res.json({ message: "User updated successfully", user: { id: user.id, name, email, role, status: user.is_active ? "Active" : "Inactive" } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};