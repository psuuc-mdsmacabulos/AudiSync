var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import User from "./user.js";
import Product from "./products.js";
let Cart = class Cart {
    constructor() {
        this.user = null;
    }
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Cart.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.carts, { onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Cart.prototype, "user", void 0);
__decorate([
    ManyToOne(() => Product, { onDelete: "CASCADE" }),
    __metadata("design:type", Product)
], Cart.prototype, "product", void 0);
__decorate([
    Column(),
    __metadata("design:type", Number)
], Cart.prototype, "quantity", void 0);
__decorate([
    Column("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Cart.prototype, "price", void 0);
__decorate([
    Column("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Cart.prototype, "total_price", void 0);
Cart = __decorate([
    Entity("cart")
], Cart);
export default Cart;
//# sourceMappingURL=cart.js.map