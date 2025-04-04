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
let ExpenseCategory = class ExpenseCategory {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], ExpenseCategory.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 100, unique: true }),
    __metadata("design:type", String)
], ExpenseCategory.prototype, "name", void 0);
__decorate([
    Column({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], ExpenseCategory.prototype, "description", void 0);
ExpenseCategory = __decorate([
    Entity("expensecategories")
], ExpenseCategory);
export default ExpenseCategory;
//# sourceMappingURL=expenseCategory.js.map