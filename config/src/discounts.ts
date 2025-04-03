import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import Product from "./products.js";

@Entity("discounts")
class Discount {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "enum", enum: ["fixed", "percentage"] })
    type!: "fixed" | "percentage";

    @Column({ type: "decimal", precision: 10, scale: 2 })
    value!: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    start_date!: Date;

    @Column({ type: "timestamp", nullable: true })
    end_date!: Date | null;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at!: Date;

    @Column({ type: "enum", enum: ["active", "inactive"], default: "active" })
    status!: "active" | "inactive";

    @ManyToOne(() => Product, (product) => product.discounts, { onDelete: "CASCADE" })
    @JoinColumn({ name: "product_id" })
    product: Product | null = null;
}

export default Discount;