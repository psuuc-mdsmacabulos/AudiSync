var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import Product from "./products.js";
let Discount = class Discount {
    constructor() {
        this.product = null;
    }
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Discount.prototype, "id", void 0);
__decorate([
    Column({ type: "enum", enum: ["fixed", "percentage"] }),
    __metadata("design:type", String)
], Discount.prototype, "type", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Discount.prototype, "value", void 0);
__decorate([
    Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Discount.prototype, "start_date", void 0);
__decorate([
    Column({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Discount.prototype, "end_date", void 0);
__decorate([
    Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Discount.prototype, "created_at", void 0);
__decorate([
    Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Discount.prototype, "updated_at", void 0);
__decorate([
    ManyToOne(() => Product, (product) => product.discounts, { onDelete: "CASCADE" }),
    JoinColumn({ name: "product_id" }),
    __metadata("design:type", Object)
], Discount.prototype, "product", void 0);
Discount = __decorate([
    Entity("discounts")
], Discount);
export default Discount;
//# sourceMappingURL=discounts.js.map