import { AppDataSource } from "../../config/data-source.js";
import Order from "../../dist/order.js";

export const getAllOrders = async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not, kitchenStatus } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            .cache(false)
            .andWhere("LOWER(order.status) != LOWER(:cancelled)", { cancelled: "cancelled" });

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

        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        if (kitchenStatus) {
            query.andWhere("LOWER(order.kitchenStatus) = LOWER(:kitchenStatus)", { kitchenStatus });
        }

        const orders = await query.getMany();

        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

export const getCancelledOrders = async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not, kitchenStatus } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            .cache(false);

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

        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        if (kitchenStatus) {
            query.andWhere("LOWER(order.kitchenStatus) = LOWER(:kitchenStatus)", { kitchenStatus });
        }

        const orders = await query.getMany();

        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        console.error("Error fetching cancelled orders:", error);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

export const getReadyOrders = async (req, res) => {
    const { search, order_type, date, payment_method, status, status_not, kitchenStatus } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            .cache(false);

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

        if (status) {
            query.andWhere("LOWER(order.status) = LOWER(:status)", { status });
        }

        if (status_not) {
            query.andWhere("LOWER(order.status) != LOWER(:status_not)", { status_not });
        }

        if (kitchenStatus) {
            query.andWhere("LOWER(order.kitchenStatus) = LOWER(:kitchenStatus)", { kitchenStatus });
        }

        const orders = await query.getMany();

        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.json(orders);
    } catch (error) {
        console.error("Error fetching ready orders:", error);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

export const getKitchenOrders = async (req, res) => {
    const { search, order_type, date, payment_method, kitchenStatus } = req.query;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        
        const query = orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.orderItems", "orderItems")
            .leftJoinAndSelect("orderItems.product", "product")
            .andWhere("LOWER(order.status) NOT IN (:ready, :cancelled, :completed)", { 
                ready: "ready", 
                cancelled: "cancelled", 
                completed: "completed" 
            });

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

        if (kitchenStatus) {
            query.andWhere("LOWER(order.kitchenStatus) = LOWER(:kitchenStatus)", { kitchenStatus });
        }

        const orders = await query.getMany();

        res.json(orders);
    } catch (error) {
        console.error("Error fetching kitchen orders:", error);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

export const getOrderById = async (req, res) => {
    const orderId = req.params.id;

    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({
            where: { id: orderId },
            relations: ["orderItems", "orderItems.product"],
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        res.status(500).json({ message: "Error fetching order" });
    }
};

export const updateOrderStatus = async (req, res) => {
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

        const updateData = { status };

        if (status.toLowerCase() === "ready") {
            updateData.kitchenStatus = "completed";
        }

        await orderRepository.update(orderId, updateData);

        res.json({ message: "Order status updated successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Error updating order status" });
    }
};