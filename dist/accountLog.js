var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import User from "./user.js";
let AccountLog = class AccountLog {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], AccountLog.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], AccountLog.prototype, "action", void 0);
__decorate([
    Column({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], AccountLog.prototype, "details", void 0);
__decorate([
    ManyToOne(() => User, { onDelete: "SET NULL" }),
    JoinColumn({ name: "performed_by_id" }),
    __metadata("design:type", Object)
], AccountLog.prototype, "performed_by", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AccountLog.prototype, "created_at", void 0);
AccountLog = __decorate([
    Entity("account_logs")
], AccountLog);
export default AccountLog;
//# sourceMappingURL=accountLog.js.map