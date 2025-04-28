var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
let FAQ = class FAQ {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], FAQ.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], FAQ.prototype, "question", void 0);
__decorate([
    Column({ type: "text" }),
    __metadata("design:type", String)
], FAQ.prototype, "answer", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], FAQ.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], FAQ.prototype, "updated_at", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], FAQ.prototype, "created_by", void 0);
__decorate([
    Column({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], FAQ.prototype, "updated_by", void 0);
FAQ = __decorate([
    Entity()
], FAQ);
export default FAQ;
//# sourceMappingURL=faq.js.map