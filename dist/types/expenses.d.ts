import ExpenseCategory from "./expenseCategory.js";
import User from "./user.js";
declare class Expense {
    id: number;
    description: string;
    amount: number;
    quantity: number | null;
    tax_amount: number;
    total_amount: number;
    invoice_number: string | null;
    notes: string | null;
    status: "pending" | "approved" | "rejected";
    payment_status: "pending" | "paid" | "overdue";
    payment_method: "cash" | "credit_card" | "bank_transfer" | "check";
    vendor: string | null;
    is_recurring: boolean;
    recurrence_interval: "daily" | "weekly" | "monthly" | "yearly" | null;
    category: ExpenseCategory | null;
    recorded_by: User | null;
    created_at: Date;
    updated_at: Date;
    constructor();
    beforeUpdate(): void;
}
export default Expense;
