import { AppDataSource } from "../../config/data-source.js";
import User from "../../dist/user.js";
import { Not } from "typeorm";

const userRepository = AppDataSource.getRepository(User);

export default {
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;
      const roleFilter = req.query.role ? req.query.role.split(',') : null;
      const includeAdmin = req.query.includeAdmin === 'true';
      const requestingUserId = req.user?.id;

      if (!requestingUserId) {
        return res.status(401).json({ message: "Unauthorized: User ID not found in request" });
      }

      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.deleted_at IS NULL') // Explicitly exclude soft-deleted users
        .skip(skip)
        .take(limit)
        .leftJoinAndSelect('user.carts', 'carts')
        .leftJoinAndSelect('user.expenses', 'expenses');

      if (roleFilter) {
        const roles = includeAdmin || roleFilter.includes('admin') ? roleFilter : [...roleFilter, Not('admin')];
        queryBuilder.andWhere('user.role IN (:...roles)', { roles });
      } else if (!includeAdmin) {
        queryBuilder.andWhere('user.role != :role', { role: 'admin' });
      }

      console.log('Raw SQL Query (manage page):', queryBuilder.getSql()); // Debug log

      const [users, total] = await queryBuilder.getManyAndCount();

      console.log("Fetched users (manage page):", users.map(u => ({ id: u.id, email: u.email, deleted_at: u.deleted_at }))); // Debug log

      res.json({
        data: users.map(user => ({
          userId: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: user.is_active ? "Active" : "Inactive",
          action: user.is_active ? "Deactivate" : "Activate",
          canSoftDelete: !user.deleted_at,
        })),
        total,
        page,
        last_page: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch users: ${error.message}` });
    }
  },

  async getSoftDeletedUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;
      const roleFilter = req.query.role ? req.query.role.split(',') : null;
      const includeAdmin = req.query.includeAdmin === 'true';
      const requestingUserId = req.user?.id;

      if (!requestingUserId) {
        return res.status(401).json({ message: "Unauthorized: User ID not found in request" });
      }

      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.deleted_at IS NOT NULL') // Fetch only soft-deleted users
        .skip(skip)
        .take(limit);

      if (roleFilter) {
        const roles = includeAdmin || roleFilter.includes('admin') ? roleFilter : [...roleFilter, Not('admin')];
        queryBuilder.andWhere('user.role IN (:...roles)', { roles });
      } else if (!includeAdmin) {
        queryBuilder.andWhere('user.role != :role', { role: 'admin' });
      }

      console.log('Raw SQL Query (deleted page):', queryBuilder.getSql()); // Debug log

      const [users, total] = await queryBuilder.getManyAndCount();

      console.log("Fetched soft-deleted users (deleted page):", users.map(u => ({ id: u.id, email: u.email, deleted_at: u.deleted_at }))); // Debug log

      res.json({
        data: users.map(user => ({
          userId: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: "Soft Deleted",
          deletedAt: user.deleted_at,
        })),
        total,
        page,
        last_page: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch soft-deleted users: ${error.message}` });
    }
  },

  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot deactivate admin users" });
      }

      user.is_active = false;
      await userRepository.save(user);

      res.json({ message: "User deactivated successfully", user: { id: user.id, status: "Inactive" } });
    } catch (error) {
      res.status(500).json({ message: `Failed to deactivate user: ${error.message}` });
    }
  },

  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot activate admin users" });
      }

      user.is_active = true;
      await userRepository.save(user);

      res.json({ message: "User activated successfully", user: { id: user.id, status: "Active" } });
    } catch (error) {
      res.status(500).json({ message: `Failed to activate user: ${error.message}` });
    }
  },

  async softDeleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot soft-delete admin users" });
      }

      user.deleted_at = new Date();
      await userRepository.save(user);

      res.json({ message: "User soft-deleted successfully", user: { id: user.id, status: "Soft Deleted" } });
    } catch (error) {
      res.status(500).json({ message: `Failed to soft-delete user: ${error.message}` });
    }
  },

  async restoreUser(req, res) {
    try {
      const { id } = req.params;
      console.log('Restoring user with id:', parseInt(id)); // Debug log

      const queryBuilder = userRepository.createQueryBuilder('user')
        .where('user.id = :id', { id: parseInt(id) })
        .andWhere('user.deleted_at IS NOT NULL');

      console.log('Raw SQL Query:', queryBuilder.getSql()); // Debug log

      const user = await queryBuilder.getOne();

      console.log('Found user:', user); // Debug log

      if (!user) {
        return res.status(404).json({ message: "User not found or not soft-deleted" });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot restore admin users" });
      }

      user.deleted_at = null;
      await userRepository.save(user);

      res.json({ message: "User restored successfully", user: { id: user.id, status: "Active" } });
    } catch (error) {
      res.status(500).json({ message: `Failed to restore user: ${error.message}` });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;
      const user = await userRepository.findOneBy({ id: parseInt(id), deleted_at: null });

      if (!user) {
        return res.status(404).json({ message: "User not found or already soft-deleted" });
      }

      const includeAdmin = req.query.includeAdmin === 'true';
      if (role && role === 'admin' && !includeAdmin) {
        return res.status(403).json({ message: "Cannot set role to admin" });
      }

      if (role && !includeAdmin && !['staff', 'kitchen'].includes(role)) {
        return res.status(400).json({ message: "Role must be either 'staff' or 'kitchen'" });
      }

      const [first_name, last_name] = name.split(' ').filter(Boolean);
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
      user.email = email || user.email;
      user.role = role || user.role;

      await userRepository.save(user);
      res.json({
        message: "User updated successfully",
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: user.is_active ? "Active" : "Inactive",
        },
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to update user: ${error.message}` });
    }
  },
};