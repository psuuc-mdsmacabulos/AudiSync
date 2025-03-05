declare class Sale {
    order_id: number;
    order_number: string;
    item: string;
    quantity: number;
    price: number;
    total_price: number;
    discount_type?: string;
    discount_value?: number;
    discount_amount: number;
    final_price: number;
    payment_method: string;
    status: string;
    staff_name: string;
    order_type: string;
    created_at: Date;
    updated_at?: Date;
}
export default Sale;
