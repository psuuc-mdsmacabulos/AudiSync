import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import User from "./user.js";

@Entity("audit_logs")
export default class AuditLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50 })
    action!: string;

    @Column({ type: "varchar", length: 50 })
    category!: string;

    @Column({ type: "text", nullable: true })
    details!: string | null;

    @ManyToOne(() => User, { onDelete: "SET NULL" })
    @JoinColumn({ name: "user_id" })
    user!: User | null;

    @CreateDateColumn()
    created_at!: Date;
}