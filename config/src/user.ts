import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, OneToMany } from "typeorm";
import Cart from "./cart.js";
import Expense from "./expenses.js";

@Entity("users")
class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    avatar!: string;

    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ type: "varchar" })
    first_name!: string;

    @Column({ type: "varchar" })
    last_name!: string;

    @Column({ type: "varchar" })
    password!: string;

    @Column({ type: "varchar" })
    role!: string;

    @Column({ type: "boolean", default: true })
    is_active!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at!: Date;

    @Column({ type: "timestamp", nullable: true })
    deleted_at!: Date | null;

    @BeforeUpdate()
    updateTimestamp() {
        this.updated_at = new Date();
    }

    @OneToMany(() => Cart, (cart) => cart.user)
    carts!: Cart[];

    @OneToMany(() => Expense, (expense) => expense.recorded_by)
    expenses!: Expense[];
}

export default User;