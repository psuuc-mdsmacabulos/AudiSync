import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import User from "./user.js";
import Product from "./products.js";

@Entity("cart")
class Cart {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.carts, { onDelete: "CASCADE" })
    user: User | null = null;

    @ManyToOne(() => Product, { onDelete: "CASCADE" })
    product!: Product;

    @Column()
    quantity!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    total_price!: number;
}

export default Cart;
