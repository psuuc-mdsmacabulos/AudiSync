import Cart from "./cart";
declare class User {
    id: number;
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
}
export default User;
