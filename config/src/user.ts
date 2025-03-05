import { Entity, PrimaryGeneratedColumn, Column, BeforeUpdate } from "typeorm";

@Entity("users")
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  first_name!: string;

  @Column({ type: "varchar" })
  last_name!: string;

  @Column({ type: "varchar" })
  password!: string;

  @Column({ type: "varchar" })
  role!: string;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updated_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  deleted_at!: Date | null;

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date();
  }
}

export default User;
