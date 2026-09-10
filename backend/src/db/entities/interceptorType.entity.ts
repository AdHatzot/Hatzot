import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LauncherAmmunition } from "./launcherAmmunition.entity";

@Entity({ schema: "hatzot", name: "interceptor_type" })
export class InterceptorType {
  @PrimaryGeneratedColumn({ type: "smallint" })
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ type: "integer", name: "range_m", nullable: true })
  rangeM!: number;

  @Column({ type: "integer", nullable: true })
  price!: number;

  @Column({ type: "jsonb", name: "estimated_success_rate", nullable: true })
  estimatedSuccessRate!: Record<string, any>;

  @Column({ type: "smallint", nullable: true })
  capacity!: number;

  @OneToMany(
    () => LauncherAmmunition,
    (launcherAmmunition) => launcherAmmunition.interceptorType
  )
  launcherAmmunitions!: LauncherAmmunition[];
}