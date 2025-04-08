import express from "express";
import { AppDataSource } from "../../config/data-source.js";
import Order from "../../dist/order.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Get all orders with filtering (excluding "cancelled" orders by default)
router.get("/", authMiddleware, async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        // Build the query using TypeORM's query builder
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            // Ensure we bypass cache to get the latest data
            .cache(false)
            // Exclude "cancelled" orders by default
            .andWhere("LOWER(order.status) != LOWER(:cancelled)", { cancelled: "cancelled" });

        // Combined search for id, customer_name, or staff_name
        if (search) {
            query.andWhere(
                `(order.id LIKE :search OR 
                LOWER(order.customer_name) LIKE LOWER(:search) OR 
                LOWER(order.staff_name) LIKE LOWER(:search))`,
                { search: `%${search}%` }
            );
        }

        if (order_type) {
            query.andWhere("LOWER(order.order_type) = LOWER(:order_type)", { order_type });
        }

        if (date) {
            query.andWhere("DATE(order.created_at) = :date", { date });
        }

        if (payment_method) {
            query.andWhere("LOWER(order.payment_method) = LOWER(:payment_method)", { payment_method });
        }

        // Filter by status (exact match) - overrides the default exclusion if specified
        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        // Exclude orders with a specific status
        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        const orders = await query.getMany();

        // Set headers to prevent caching
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// Get all orders with filtering
router.get("/cancelled/", authMiddleware, async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        // Build the query using TypeORM's query builder
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            // Ensure we bypass cache to get the latest data
            .cache(false);

        // Combined search for id, customer_name, or staff_name
        if (search) {
            query.andWhere(
                `(order.id LIKE :search OR 
                LOWER(order.customer_name) LIKE LOWER(:search) OR 
                LOWER(order.staff_name) LIKE LOWER(:search))`,
                { search: `%${search}%` }
            );
        }

        if (order_type) {
            query.andWhere("LOWER(order.order_type) = LOWER(:order_type)", { order_type });
        }

        if (date) {
            query.andWhere("DATE(order.created_at) = :date", { date });
        }

        if (payment_method) {
            query.andWhere("LOWER(order.payment_method) = LOWER(:payment_method)", { payment_method });
        }

        // Filter by status (exact match)
        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        // Exclude orders with a specific status
        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        const orders = await query.getMany();

        // Set headers to prevent caching
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// Get all orders with filtering
router.get("/cancelled/", authMiddleware, async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        // Build the query using TypeORM's query builder
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            // Ensure we bypass cache to get the latest data
            .cache(false);

        // Combined search for id, customer_name, or staff_name
        if (search) {
            query.andWhere(
                `(order.id LIKE :search OR 
                LOWER(order.customer_name) LIKE LOWER(:search) OR 
                LOWER(order.staff_name) LIKE LOWER(:search))`,
                { search: `%${search}%` }
            );
        }

        if (order_type) {
            query.andWhere("LOWER(order.order_type) = LOWER(:order_type)", { order_type });
        }

        if (date) {
            query.andWhere("DATE(order.created_at) = :date", { date });
        }

        if (payment_method) {
            query.andWhere("LOWER(order.payment_method) = LOWER(:payment_method)", { payment_method });
        }

        // Filter by status (exact match)
        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        // Exclude orders with a specific status
        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        const orders = await query.getMany();

        // Set headers to prevent caching
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// Get all orders with filtering
router.get("/ready/", authMiddleware, async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        // Build the query using TypeORM's query builder
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            // Ensure we bypass cache to get the latest data
            .cache(false);

        // Combined search for id, customer_name, or staff_name
        if (search) {
            query.andWhere(
                `(order.id LIKE :search OR 
                LOWER(order.customer_name) LIKE LOWER(:search) OR 
                LOWER(order.staff_name) LIKE LOWER(:search))`,
                { search: `%${search}%` }
            );
        }

        if (order_type) {
            query.andWhere("LOWER(order.order_type) = LOWER(:order_type)", { order_type });
        }

        if (date) {
            query.andWhere("DATE(order.created_at) = :date", { date });
        }

        if (payment_method) {
            query.andWhere("LOWER(order.payment_method) = LOWER(:payment_method)", { payment_method });
        }

        // Filter by status (exact match)
        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        // Exclude orders with a specific status
        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        const orders = await query.getMany();

        // Set headers to prevent caching
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});


// Get all orders with filtering for kitchen (excluding "ready" and "cancelled" statuses)
router.get("/kitchen/", authMiddleware, async (req, res) => {
    const { search, order_type, date, payment_method } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        // Build the query using TypeORM's query builder
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            .andWhere("LOWER(order.status) NOT IN (:ready, :cancelled, :completed)", { ready: "ready", cancelled: "cancelled", completed: "completed" }); 

        // Combined search for id, customer_name, or staff_name
        if (search) {
            query.andWhere(
                `(order.id LIKE :search OR 
                LOWER(order.customer_name) LIKE LOWER(:search) OR 
                LOWER(order.staff_name) LIKE LOWER(:search))`,
                { search: `%${search}%` }
            );
        }

        if (order_type) {
            query.andWhere("LOWER(order.order_type) = LOWER(:order_type)", { order_type });
        }

        if (date) {
            query.andWhere("DATE(order.created_at) = :date", { date });
        }

        if (payment_method) {
            query.andWhere("LOWER(order.payment_method) = LOWER(:payment_method)", { payment_method });
        }

        const orders = await query.getMany();

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// Get a single order by ID
router.get("/:id", authMiddleware, async (req, res) => {
    const orderId = req.params.id;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({
            where: { id: orderId },
            relations: ["orderItems", "orderItems.product"], // Fetch the product data along with the order items
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error fetching order" });
    }
});

// Update order status
router.patch("/:id/status", authMiddleware, async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        await orderRepository.update(orderId, { status });

        res.json({ message: "Order status updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating order status" });
    }
});

export default router;