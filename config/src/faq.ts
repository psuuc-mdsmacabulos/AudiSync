import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export default class FAQ {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    question!: string;

    @Column({ type: "text" })
    answer!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ type: "varchar", length: 255 })
    created_by!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    updated_by!: string | null;
}