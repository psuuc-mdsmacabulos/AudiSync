import Cart from "./cart";
import Order from "./order";
declare class Product {
    id: number;
    item: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
    created_at: Date;
    deleted_at: Date | null;
    updateTimestamp(): void;
    carts: Cart[];
    orders: Order[];
}
export default Product;
