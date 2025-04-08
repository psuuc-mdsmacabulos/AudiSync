import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import ExpenseCategory from "./expenseCategory.js";
import User from "./user.js";

@Entity("expenses")
class Expense {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: "int", nullable: true, default: null })
    quantity!: number | null;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    tax_amount!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    total_amount!: number;

    @Column({ type: "varchar", length: 50, nullable: true })
    invoice_number!: string | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @Column({ type: "enum", enum: ["pending", "approved", "rejected"], default: "pending" })
    status!: "pending" | "approved" | "rejected";

    @Column({ type: "enum", enum: ["pending", "paid", "overdue"], default: "pending" })
    payment_status!: "pending" | "paid" | "overdue";

    @Column({ type: "enum", enum: ["cash", "credit_card", "bank_transfer", "check"], default: "cash" })
    payment_method!: "cash" | "credit_card" | "bank_transfer" | "check";

    @Column({ type: "varchar", length: 100, nullable: true })
    vendor!: string | null;

    @Column({ type: "boolean", default: false })
    is_recurring!: boolean;

    @Column({ type: "enum", enum: ["daily", "weekly", "monthly", "yearly"], nullable: true })
    recurrence_interval!: "daily" | "weekly" | "monthly" | "yearly" | null;

    @ManyToOne(() => ExpenseCategory, { onDelete: "SET NULL" })
    @JoinColumn({ name: "category_id" })
    category!: ExpenseCategory | null;

    @ManyToOne(() => User, (user) => user.expenses, { onDelete: "SET NULL" })
    @JoinColumn({ name: "user_id" })
    recorded_by!: User | null;

    @CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at!: Date;
}


export default Expense;