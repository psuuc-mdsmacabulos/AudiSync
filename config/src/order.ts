import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import Product from "../../dist/products.js";

@Entity("orders")
class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Product, (product: Product) => product.order_id)
    item!: Product;

    @Column({ type: "varchar", length: 50 })
    order_type!: string;  // "Dine-in", "Takeout", etc.

    @Column({ type: "varchar", length: 255, nullable: true })
    customer_name!: string | null;

    @Column({ type: "varchar", length: 20 })
    discount_type!: string; // "percentage" or "fixed"

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discount_value!: number; // E.g., 10 (for 10% discount) or 100 (for PHP 100 off)

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    discount_amount!: number; // Computed discount amount

    @Column({ type: "decimal", precision: 10, scale: 2 })
    final_price!: number; // Total after discount

    @Column({ type: "varchar", length: 50 })
    payment_method!: string; // "Cash", "Credit Card"

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount_paid!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    change!: number; // Computed as amount_paid - final_price

    @CreateDateColumn()
    created_at!: Date;
}

export default Order;
