import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import OrderItem from "./order_item.js";  
import Category from "./category.js";
import Discount from "./discounts.js";

@Entity("products")
class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  image?: string;

  @Column({ nullable: true, type: "varchar", length: 255 }) 
  updated_by!: string;  

  @Column({ type: "timestamp", nullable: true })
  updated_at!: Date | null;  

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  deleted_at!: Date | null;

  @Column({ nullable: true, type: "varchar", length: 255 }) 
  deleted_by!: string | null;

  @Column({ type: "int" })
  category_id!: number;

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date(); 
  }

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" }) 
  category!: Category;

  // ✅ Fixed: Now referencing OrderItem instead of Cart
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];  

  @OneToMany(() => Discount, (discount) => discount.product)
  discounts!: Discount[];
}

export default Product;
