var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import Product from "./products.js";
let User;
let Cart = class Cart {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Cart.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.carts),
    __metadata("design:type", Object)
], Cart.prototype, "staff_name", void 0);
__decorate([
    ManyToOne(() => Product, (product) => product.carts),
    __metadata("design:type", Product)
], Cart.prototype, "product", void 0);
__decorate([
    Column("int"),
    __metadata("design:type", Number)
], Cart.prototype, "quantity", void 0);
__decorate([
    Column("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Cart.prototype, "price", void 0);
__decorate([
    Column("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Cart.prototype, "total_price", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Cart.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Cart.prototype, "updated_at", void 0);
Cart = __decorate([
    Entity()
], Cart);
import("./user.js").then((module) => {
    User = module.default;
});
export default Cart;
//# sourceMappingURL=cart.js.map