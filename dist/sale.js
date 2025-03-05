var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
let Sale = class Sale {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Sale.prototype, "order_id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], Sale.prototype, "order_number", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Sale.prototype, "item", void 0);
__decorate([
    Column("int"),
    __metadata("design:type", Number)
], Sale.prototype, "quantity", void 0);
__decorate([
    Column("float"),
    __metadata("design:type", Number)
], Sale.prototype, "price", void 0);
__decorate([
    Column("float"),
    __metadata("design:type", Number)
], Sale.prototype, "total_price", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Sale.prototype, "discount_type", void 0);
__decorate([
    Column({ nullable: true, type: "float" }),
    __metadata("design:type", Number)
], Sale.prototype, "discount_value", void 0);
__decorate([
    Column("float"),
    __metadata("design:type", Number)
], Sale.prototype, "discount_amount", void 0);
__decorate([
    Column("float"),
    __metadata("design:type", Number)
], Sale.prototype, "final_price", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Sale.prototype, "payment_method", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Sale.prototype, "status", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Sale.prototype, "staff_name", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Sale.prototype, "order_type", void 0);
__decorate([
    Column("timestamp", { default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Sale.prototype, "created_at", void 0);
__decorate([
    Column("timestamp", { nullable: true }),
    __metadata("design:type", Date)
], Sale.prototype, "updated_at", void 0);
Sale = __decorate([
    Entity("sales")
], Sale);
export default Sale;
//# sourceMappingURL=sale.js.map