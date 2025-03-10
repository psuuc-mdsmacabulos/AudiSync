import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, OneToMany } from "typeorm";
import Cart from "./cart"; 
import Order from "./order";  // Import the Order entity

@Entity("products")
class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  item!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  image?: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  deleted_at!: Date | null;

  @BeforeUpdate()
  updateTimestamp() {
    this.created_at = new Date();
  }

  @OneToMany(() => Cart, (cart) => cart.product)
  carts!: Cart[];

  @OneToMany(() => Order, (order) => order.item)
  orders!: Order[];  
}

export default Product;
