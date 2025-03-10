import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import Product from "./products";

@Entity("orders")
class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Product, (product) => product.orders, { nullable: false })
    item: Product | null = null;

    @Column({ type: "varchar", length: 50 })
    order_type!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    customer_name?: string;

    @Column({ type: "varchar", length: 255 })
    staff_name!: string;

    @Column({ type: "varchar", length: 20 })
    discount_type!: string;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discount_value!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discount_amount!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    final_price!: number;

    @Column({ type: "varchar", length: 50 })
    payment_method!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount_paid!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    change!: number;

    @CreateDateColumn()
    created_at!: Date;
}

export default Order;
