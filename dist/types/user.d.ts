import Cart from "./cart.js";
import Expense from "./expenses.js";
declare class User {
    id: number;
    avatar: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    updateTimestamp(): void;
    carts: Cart[];
    expenses: Expense[];
}
export default User;
