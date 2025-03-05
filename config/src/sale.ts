import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("sales")
class Sale {
  @PrimaryGeneratedColumn()
  order_id!: number; 

  @Column({ unique: true }) 
  order_number!: string;

  @Column()
  item!: string; 

  @Column("int")
  quantity!: number;

  @Column("float")
  price!: number; 

  @Column("float")
  total_price!: number;

  @Column({ nullable: true })
  discount_type?: string;

  @Column({ nullable: true, type: "float" })
  discount_value?: number; 

  @Column("float")
  discount_amount!: number; 

  @Column("float")
  final_price!: number; 

  @Column()
  payment_method!: string;

  @Column()
  status!: string; 

  @Column()
  staff_name!: string; 

  @Column()
  order_type!: string; 

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column("timestamp", { nullable: true })
  updated_at?: Date;
}

export default Sale;
