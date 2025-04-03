import Product from "./products.js";
declare class Discount {
    id: number;
    type: "fixed" | "percentage";
    value: number;
    start_date: Date;
    end_date: Date | null;
    created_at: Date;
    updated_at: Date;
    status: "active" | "inactive";
    product: Product | null;
}
export default Discount;
