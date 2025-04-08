import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import OrderItem from "./order_item.js";

@Entity("orders")
class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    order_type!: string;

    @Column()
    customer_name!: string;

    @Column()
    staff_name!: string;

    @Column({ nullable: true })
    discount_type!: string;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discount_value!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discount_amount!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    final_price!: number;

    @Column()
    payment_method!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount_paid!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    change!: number;

    @Column({ type: "varchar", default: "pending" })
    status!: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "varchar", default: "pending" })
    kitchenStatus!: string;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true }) 
    orderItems!: OrderItem[];
}

export default Order;