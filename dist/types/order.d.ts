import Product from "../src/products";
declare class Order {
    id: number;
    item: Product | null;
    order_type: string;
    customer_name?: string;
    staff_name: string;
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
