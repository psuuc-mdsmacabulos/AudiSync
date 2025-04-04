var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import ExpenseCategory from "./expenseCategory.js";
import User from "./user.js";
let Expense = class Expense {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Expense.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Expense.prototype, "description", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Expense.prototype, "amount", void 0);
__decorate([
    Column({ type: "int", nullable: true, default: null }),
    __metadata("design:type", Object)
], Expense.prototype, "quantity", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Expense.prototype, "tax_amount", void 0);
__decorate([
    Column({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Expense.prototype, "total_amount", void 0);
__decorate([
    Column({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Expense.prototype, "invoice_number", void 0);
__decorate([
    Column({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Expense.prototype, "notes", void 0);
__decorate([
    Column({ type: "enum", enum: ["pending", "approved", "rejected"], default: "pending" }),
    __metadata("design:type", String)
], Expense.prototype, "status", void 0);
__decorate([
    Column({ type: "enum", enum: ["pending", "paid", "overdue"], default: "pending" }),
    __metadata("design:type", String)
], Expense.prototype, "payment_status", void 0);
__decorate([
    Column({ type: "date" }),
    __metadata("design:type", Date)
], Expense.prototype, "date", void 0);
__decorate([
    Column({ type: "enum", enum: ["cash", "credit_card", "bank_transfer", "check"], default: "cash" }),
    __metadata("design:type", String)
], Expense.prototype, "payment_method", void 0);
__decorate([
    Column({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Expense.prototype, "vendor", void 0);
__decorate([
    Column({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Expense.prototype, "is_recurring", void 0);
__decorate([
    Column({ type: "enum", enum: ["daily", "weekly", "monthly", "yearly"], nullable: true }),
    __metadata("design:type", Object)
], Expense.prototype, "recurrence_interval", void 0);
__decorate([
    ManyToOne(() => ExpenseCategory, { onDelete: "SET NULL" }),
    JoinColumn({ name: "category_id" }),
    __metadata("design:type", Object)
], Expense.prototype, "category", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.expenses, { onDelete: "SET NULL" }),
    JoinColumn({ name: "user_id" }),
    __metadata("design:type", Object)
], Expense.prototype, "recorded_by", void 0);
__decorate([
    CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Expense.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Expense.prototype, "updated_at", void 0);
Expense = __decorate([
    Entity("expenses")
], Expense);
export default Expense;
//# sourceMappingURL=expenses.js.map