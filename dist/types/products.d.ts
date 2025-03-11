import Cart from "./cart";
import Order from "./order";
declare class Product {
    id: number;
    name: string;
    category: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
    updated_by: string;
    updated_at: Date | null;
    created_at: Date;
    deleted_at: Date | null;
    deleted_by: string | null;
    updateTimestamp(): void;
    carts: Cart[];
    orders: Order[];
}
export default Product;
