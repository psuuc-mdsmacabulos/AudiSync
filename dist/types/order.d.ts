import Product from "../../dist/products.js";
declare class Order {
    id: number;
    item: Product;
    order_type: string;
    customer_name: string | null;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    final_price: number;
    payment_method: string;
    amount_paid: number;
    change: number;
    created_at: Date;
}
export default Order;
