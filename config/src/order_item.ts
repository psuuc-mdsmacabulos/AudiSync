import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import Order from "./order.js";
import Product from "./products.js";

@Entity("order_items")
class OrderItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: "CASCADE" })
    order!: Order;

    @ManyToOne(() => Product, { onDelete: "CASCADE" })
    product: Product | null = null;

    @Column()
    quantity!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    total_price!: number;
}

export default OrderItem;
