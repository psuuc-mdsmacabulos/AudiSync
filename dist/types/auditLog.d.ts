import User from "./user.js";
export default class AuditLog {
    id: number;
    action: string;
    category: string;
    details: string | null;
    user: User | null;
    created_at: Date;
}
