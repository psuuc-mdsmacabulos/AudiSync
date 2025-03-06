import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import Product from "../src/products"; 

// Use dynamic import for User to avoid circular dependency issues
let User: typeof import("../src/user").default;

@Entity()
class Cart {
    @PrimaryGeneratedColumn()
    id!: number;

    // Use dynamic import for `User`
    @ManyToOne(() => User, (user) => user.carts)
    staff_name!: typeof User;  // Use the class type here as well

    @ManyToOne(() => Product, (product) => product.carts)
    product!: Product;

    @Column("int")
    quantity!: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    price!: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    total_price!: number;

    @CreateDateColumn()
    created_at!: Date; 

    @UpdateDateColumn()
    updated_at!: Date;
}

// Ensure dynamic import for User class is handled before use
import("../src/user").then((module) => {
    User = module.default;
});

export default Cart;
