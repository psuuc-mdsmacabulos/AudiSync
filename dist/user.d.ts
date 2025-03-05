declare class User {
    id: number;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    updateTimestamp(): void;
}
export default User;
