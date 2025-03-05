declare class Product {
    order_id: number;
    item: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
    created_at: Date;
    deleted_at: Date | null;
    updateTimestamp(): void;
}
export default Product;
