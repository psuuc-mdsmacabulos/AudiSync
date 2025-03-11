import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Cart from "../dist/cart.js";
import User from "../dist/user.js";
import Order from "../dist/order.js";
import Product from "../dist/products.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add Item to Cart
router.post("/add", async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
        return res.status(400).json({ message: "User ID, Product ID, and Quantity are required." });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const productRepository = AppDataSource.getRepository(Product);
        const cartRepository = AppDataSource.getRepository(Cart);

        //   Check if user exists
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if product exists
        const product = await productRepository.findOne({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if product has enough stock
        if (product.quantity < quantity) {
            return res.status(400).json({ message: "Not enough stock available" });
        }

        const price = parseFloat(product.price);
        const total_price = price * quantity;

        // Deduct quantity from product stock
        product.quantity -= quantity;
        await productRepository.save(product); 

        // Create cart item
        const newCartItem = cartRepository.create({
            user,  
            product,
            quantity,
            price,
            total_price,
        });

        await cartRepository.save(newCartItem);

        res.json({
            message: "Item added to cart successfully",
            cartItem: newCartItem,
        });
    } catch (err) {
        console.error("Error adding item to cart:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Update Cart 
router.post("/update", authMiddleware, async (req, res) => {
    const { productId, quantity } = req.body;
    const user = req.user; // Authenticated user

    if (!productId || quantity === undefined) {
        return res.status(400).json({ message: "Product ID and quantity are required." });
    }

    try {
        const cartRepository = AppDataSource.getRepository(Cart);
        const productRepository = AppDataSource.getRepository(Product);

        // Check if product exists
        const product = await productRepository.findOne({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Find cart item for the user
        const existingCartItem = await cartRepository.findOne({ where: { user, product } });

        if (existingCartItem) {
            if (quantity === 0) {
                // Remove item if quantity is 0
                await cartRepository.delete({ id: existingCartItem.id });
                return res.json({ message: "Item removed from cart" });
            } else {
                // Update existing cart item
                existingCartItem.quantity = quantity;
                existingCartItem.total_price = parseFloat(product.price) * quantity;
                await cartRepository.save(existingCartItem);
                return res.json({ message: "Cart updated successfully", cartItem: existingCartItem });
            }
        } else {
            if (quantity > 0) {
                // Add new item to cart
                const newCartItem = cartRepository.create({
                    user,
                    product,
                    quantity,
                    price: parseFloat(product.price),
                    total_price: parseFloat(product.price) * quantity,
                });

                await cartRepository.save(newCartItem);
                return res.json({ message: "Item added to cart", cartItem: newCartItem });
            } else {
                return res.status(400).json({ message: "Invalid quantity" });
            }
        }
    } catch (err) {
        console.error("Error updating cart:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// Checkout - Convert Cart to Order
router.post("/checkout", authMiddleware, async (req, res) => {
    const { order_type, customer_name, discount_type, discount_value, payment_method, amount_paid } = req.body;
    const user = req.user;

    try {
        const cartRepository = AppDataSource.getRepository(Cart);
        const orderRepository = AppDataSource.getRepository(Order);

        // Get cart items for this user
        const cartItems = await cartRepository.find({ 
            where: { user },  
            relations: ["product"],
        });

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Calculate prices
        let total_price = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
        let discount_amount = discount_type === "percentage" ? (discount_value / 100) * total_price : discount_value;
        const final_price = total_price - discount_amount;
        const change = amount_paid - final_price;

        // Order creation
        const order = orderRepository.create({
            item: cartItems[0].product, 
            order_type,
            customer_name,
            staff_name: `${user.first_name} ${user.last_name}`,  
            discount_type,
            discount_value,
            discount_amount,
            final_price,
            payment_method,
            amount_paid,
            change,
        });
        
        // Save order and clear cart
        await orderRepository.save(order);
        await cartRepository.delete({ user });

        res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
