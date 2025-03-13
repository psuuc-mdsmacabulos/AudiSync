import express from "express";
import { AppDataSource } from "../config/data-source.js";
import Cart from "../dist/cart.js";
import User from "../dist/user.js";
import Order from "../dist/order.js";
import Product from "../dist/products.js";
import Discount from "../dist/discounts.js";
import OrderItem from "../dist/order_item.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm"; 

const router = express.Router();

/** Add items to cart */
router.post("/add", async (req, res) => {

    const { userId, products } = req.body;

    if (!userId || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "User ID and an array of products are required." });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const productRepository = AppDataSource.getRepository(Product);
        const discountRepository = AppDataSource.getRepository(Discount);
        const cartRepository = AppDataSource.getRepository(Cart);

        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentDate = new Date();
        let cartItems = [];

        for (const item of products) {
            const { productId, quantity } = item;

            const product = await productRepository.findOne({ where: { id: productId } });
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${productId} not found` });
            }

            if (product.quantity < quantity) {
                return res.status(400).json({ message: `Not enough stock for product ID ${productId}` });
            }

            const activeDiscount = await discountRepository.findOne({
                where: {
                    product: { id: productId },
                    start_date: LessThanOrEqual(currentDate),
                    end_date: MoreThanOrEqual(currentDate),
                },
            });

            let final_price = parseFloat(product.price);
            if (activeDiscount) {
                if (activeDiscount.type === "percentage") {
                    final_price -= (final_price * (activeDiscount.value / 100));
                } else if (activeDiscount.type === "fixed") {
                    final_price = Math.max(0, final_price - activeDiscount.value);
                }
            }

            const total_price = final_price * quantity;
            product.quantity -= quantity;
            await productRepository.save(product);

            const newCartItem = cartRepository.create({
                user,
                product, 
                quantity,
                price: final_price,
                total_price,
            });

            await cartRepository.save(newCartItem);
            cartItems.push(newCartItem);
        }

        res.json({ message: "Items added to cart successfully", cartItems });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


// Cart to checkout
router.post("/checkout", authMiddleware, async (req, res) => {
    const { order_type, customer_name, discount_type, discount_value = 0, payment_method, amount_paid } = req.body;
    const user = req.user;

    try {
        const cartRepository = AppDataSource.getRepository(Cart);
        const orderRepository = AppDataSource.getRepository(Order);
        const orderItemRepository = AppDataSource.getRepository(OrderItem);

        // Fetch user's cart with product details
        const cartItems = await cartRepository.find({
            where: { user },
            relations: ["product"], 
        });

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        let total_price = 0;
        let orderItemsToSave = [];

        for (const cartItem of cartItems) {
            const itemTotal = parseFloat(cartItem.total_price);
            total_price += itemTotal; 

            const newOrderItem = orderItemRepository.create({
                product: cartItem.product,
                quantity: cartItem.quantity,
                price: parseFloat(cartItem.price), 
                total_price: itemTotal,
            });

            orderItemsToSave.push(newOrderItem);
        }

        // **Apply discount**
        let discount_amount = 0;
        if (discount_type === "percentage" && discount_value > 0) {
            discount_amount = (discount_value / 100) * total_price;
        } else if (discount_type === "fixed" && discount_value > 0) {
            discount_amount = discount_value;
        }
        discount_amount = Math.min(discount_amount, total_price);
        discount_amount = isNaN(discount_amount) ? 0 : discount_amount;

        // **Calculate final price**
        const final_price = total_price - discount_amount;
        const valid_final_price = isNaN(final_price) ? 0 : final_price;

        // **Calculate change**
        const change = isNaN(amount_paid - valid_final_price) ? 0 : amount_paid - valid_final_price;
        if (change < 0) {
            return res.status(400).json({ message: "Insufficient payment" });
        }

        // **Create a new order**
        const order = orderRepository.create({
            order_type,
            customer_name,
            staff_name: `${user.first_name} ${user.last_name}`,
            discount_type,
            discount_value,
            discount_amount,
            final_price: valid_final_price, 
            payment_method,
            amount_paid,
            change,
        });

        const savedOrder = await orderRepository.save(order);

        // **Link OrderItems to the Order and save them**
        for (const orderItem of orderItemsToSave) {
            orderItem.order = savedOrder; // ✅ Set the order relation
            await orderItemRepository.save(orderItem);
            console.log(`✅ OrderItem saved for Product ID ${orderItem.product.id}`);
        }

        // **Clear user's cart**
        await cartRepository.delete({ user });
        return res.status(201).json({ message: "Order placed successfully", order });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
});


export default router;
