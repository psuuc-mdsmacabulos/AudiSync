import User from "./user.js";
export default class AccountLog {
    id: number;
    action: string;
    details: string | null;
    performed_by: User | null;
    created_at: Date;
}
