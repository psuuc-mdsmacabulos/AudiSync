import User from "./user.js";
import Product from "./products.js";
declare class Cart {
    id: number;
    user: User | null;
    product: Product;
    quantity: number;
    price: number;
    total_price: number;
}
export default Cart;
