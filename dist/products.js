var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import OrderItem from "./order_item.js";
import Category from "./category.js";
import Discount from "./discounts.js";
let Product = class Product {
    updateTimestamp() {
        this.updated_at = new Date();
    }
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    Column({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    Column({ type: "int" }),
    __metadata("design:type", Number)
], Product.prototype, "quantity", void 0);
__decorate([
    Column({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "image", void 0);
__decorate([
    Column({ nullable: true, type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "updated_by", void 0);
__decorate([
    Column({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "updated_at", void 0);
__decorate([
    Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Product.prototype, "created_at", void 0);
__decorate([
    Column({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "deleted_at", void 0);
__decorate([
    Column({ nullable: true, type: "varchar", length: 255 }),
    __metadata("design:type", Object)
], Product.prototype, "deleted_by", void 0);
__decorate([
    Column({ type: "int" }),
    __metadata("design:type", Number)
], Product.prototype, "category_id", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "is_active", void 0);
__decorate([
    BeforeUpdate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Product.prototype, "updateTimestamp", null);
__decorate([
    ManyToOne(() => Category, (category) => category.products),
    JoinColumn({ name: "category_id" }),
    __metadata("design:type", Category)
], Product.prototype, "category", void 0);
__decorate([
    OneToMany(() => OrderItem, (orderItem) => orderItem.product),
    __metadata("design:type", Array)
], Product.prototype, "orderItems", void 0);
__decorate([
    OneToMany(() => Discount, (discount) => discount.product),
    __metadata("design:type", Array)
], Product.prototype, "discounts", void 0);
Product = __decorate([
    Entity("products")
], Product);
export default Product;
//# sourceMappingURL=products.js.map