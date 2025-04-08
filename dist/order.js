var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import OrderItem from "./order_item.js";
let Order = class Order {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Order.prototype, "order_type", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Order.prototype, "customer_name", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Order.prototype, "staff_name", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "discount_type", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discount_value", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discount_amount", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "final_price", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Order.prototype, "payment_method", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "amount_paid", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "change", void 0);
__decorate([
    Column({ type: "varchar", default: "pending" }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Order.prototype, "created_at", void 0);
__decorate([
    Column({ type: "varchar", default: "pending" }),
    __metadata("design:type", String)
], Order.prototype, "kitchenStatus", void 0);
__decorate([
    OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "orderItems", void 0);
Order = __decorate([
    Entity("orders")
], Order);
export default Order;
//# sourceMappingURL=order.js.map