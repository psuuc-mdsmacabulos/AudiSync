import User from "./user";
import Product from "./products";
declare class Cart {
    id: number;
    user: User | null;
    product: Product;
    quantity: number;
    price: number;
    total_price: number;
    created_at: Date;
    updated_at: Date;
}
export default Cart;
