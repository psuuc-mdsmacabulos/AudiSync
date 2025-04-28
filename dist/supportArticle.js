var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import SupportCategory from "./supportcategory.js";
let SupportArticle = class SupportArticle {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], SupportArticle.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], SupportArticle.prototype, "title", void 0);
__decorate([
    Column({ type: "text" }),
    __metadata("design:type", String)
], SupportArticle.prototype, "content", void 0);
__decorate([
    Column({ type: "varchar", length: 20, default: "article" }),
    __metadata("design:type", String)
], SupportArticle.prototype, "type", void 0);
__decorate([
    Column({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], SupportArticle.prototype, "video_url", void 0);
__decorate([
    ManyToOne(() => SupportCategory, { nullable: true }),
    __metadata("design:type", SupportCategory)
], SupportArticle.prototype, "category", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], SupportArticle.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], SupportArticle.prototype, "updated_at", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], SupportArticle.prototype, "created_by", void 0);
__decorate([
    Column({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], SupportArticle.prototype, "updated_by", void 0);
SupportArticle = __decorate([
    Entity()
], SupportArticle);
export default SupportArticle;
//# sourceMappingURL=supportArticle.js.map