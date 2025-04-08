import { Router } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../config/data-source.js";
import User from "../../dist/user.js";

const router = Router();

// CREATE USER ROUTE
router.post("/register", async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);

        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = userRepository.create({
            email,
            first_name,
            last_name,
            password: hashedPassword,
            role,
        });

        // Save to the database
        await userRepository.save(newUser);

        res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: newUser.id,
                name: `${newUser.first_name} ${newUser.last_name}`,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
