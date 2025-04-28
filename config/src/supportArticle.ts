import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import SupportCategory from "./supportcategory.js";

@Entity()
export default class SupportArticle {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ type: "varchar", length: 20, default: "article" })
    type!: "article" | "video";

    @Column({ type: "varchar", length: 255, nullable: true })
    video_url!: string | null;

    @ManyToOne(() => SupportCategory, { nullable: true })
    category?: SupportCategory;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ type: "varchar", length: 255 })
    created_by!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    updated_by!: string | null;
}