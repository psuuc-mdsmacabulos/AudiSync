import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import User from "./user.js";

@Entity("account_logs")
export default class AccountLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50 })
    action!: string;

    @Column({ type: "text", nullable: true })
    details!: string | null;

    @ManyToOne(() => User, { onDelete: "SET NULL" })
    @JoinColumn({ name: "performed_by_id" })
    performed_by!: User | null;

    @CreateDateColumn()
    created_at!: Date;
}