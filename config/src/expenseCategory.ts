import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("expensecategories")
class ExpenseCategory {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    description!: string | null;
}

export default ExpenseCategory;