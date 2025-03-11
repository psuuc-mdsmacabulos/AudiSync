import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, OneToMany } from "typeorm";
import Cart from "./cart"; 
import Order from "./order";  

@Entity("products")
class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  category!: string;

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

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date(); 
  }

  @OneToMany(() => Cart, (cart) => cart.product)
  carts!: Cart[];

  @OneToMany(() => Order, (order) => order.item)
  orders!: Order[];  
}

export default Product;
