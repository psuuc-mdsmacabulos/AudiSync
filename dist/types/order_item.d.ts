import Order from "./order.js";
import Product from "./products.js";
declare class OrderItem {
    id: number;
    order: Order;
    product: Product | null;
    quantity: number;
    price: number;
    total_price: number;
}
export default OrderItem;
