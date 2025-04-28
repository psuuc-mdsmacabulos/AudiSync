import SupportCategory from "./supportcategory.js";
export default class SupportArticle {
    id: number;
    title: string;
    content: string;
    type: "article" | "video";
    video_url: string | null;
    category?: SupportCategory;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    updated_by: string | null;
}
