import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export interface SuccessRateEntry {
  droneType: string;
  successRate: number;
}

@Entity("interceptor_type")
export class InterceptorType {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "name", type: "text" })
  name!: string;

  @Column({ name: "range_m", type: "integer" })
  rangeM!: number;

  @Column({ name: "price", type: "integer" })
  price!: number;

  @Column({ name: "estimated_success_rate", type: "jsonb" })
  estimatedSuccessRate!: SuccessRateEntry[];

  @Column({ name: "capacity", type: "smallint" })
  capacity!: number;
}