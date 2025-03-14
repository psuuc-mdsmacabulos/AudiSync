import OrderItem from "./order_item.js";
import Category from "./category.js";
import Discount from "./discounts.js";
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
    is_active: boolean;
    updateTimestamp(): void;
    category: Category;
    orderItems: OrderItem[];
    discounts: Discount[];
}
export default Product;
