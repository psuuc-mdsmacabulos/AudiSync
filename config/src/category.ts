import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import Product from "./products"; 

@Entity("categories")
class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}

export default Category;
