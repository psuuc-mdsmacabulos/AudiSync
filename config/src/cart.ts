import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    CreateDateColumn, 
    UpdateDateColumn 
} from "typeorm";
import User from "./user";  
import Product from "./products"; 

@Entity()
class Cart {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.carts, { nullable: true })
    user!: User | null;

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

export default Cart;
