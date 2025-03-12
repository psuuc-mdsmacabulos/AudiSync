import Cart from "./cart";
import Order from "./order";
import Category from "./category";
declare class Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
    updated_by: string;
    updated_at: Date | null;
    created_at: Date;
    deleted_at: Date | null;
    deleted_by: string | null;
    category_id: number;
    updateTimestamp(): void;
    category: Category;
    carts: Cart[];
    orders: Order[];
}
export default Product;
