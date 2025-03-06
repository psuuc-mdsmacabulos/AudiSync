import Product from "../src/products";
declare let User: typeof import("../src/user").default;
declare class Cart {
    id: number;
    staff_name: typeof User;
    product: Product;
    quantity: number;
    price: number;
    total_price: number;
    created_at: Date;
    updated_at: Date;
}
export default Cart;
