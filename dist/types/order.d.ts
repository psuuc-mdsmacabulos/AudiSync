import OrderItem from "./order_item.js";
declare class Order {
    id: number;
    order_type: string;
    customer_name: string;
    staff_name: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    final_price: number;
    payment_method: string;
    amount_paid: number;
    change: number;
    status: string;
    created_at: Date;
    orderItems: OrderItem[];
}
export default Order;
