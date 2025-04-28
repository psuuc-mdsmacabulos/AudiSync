export default class FAQ {
    id: number;
    question: string;
    answer: string;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    updated_by: string | null;
}
