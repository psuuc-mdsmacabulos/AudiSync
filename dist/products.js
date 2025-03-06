var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, OneToMany } from "typeorm";
import Cart from "./cart.js";
import Order from "./order.js";
let Product = class Product {
    updateTimestamp() {
        this.created_at = new Date();
    }
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "item", void 0);
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
    Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Product.prototype, "created_at", void 0);
__decorate([
    Column({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "deleted_at", void 0);
__decorate([
    BeforeUpdate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Product.prototype, "updateTimestamp", null);
__decorate([
    OneToMany(() => Cart, (cart) => cart.product),
    __metadata("design:type", Array)
], Product.prototype, "carts", void 0);
__decorate([
    OneToMany(() => Order, (order) => order.item),
    __metadata("design:type", Array)
], Product.prototype, "orders", void 0);
Product = __decorate([
    Entity("products")
], Product);
export default Product;
//# sourceMappingURL=products.js.map