import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LauncherAmmunition } from "./launcherAmmunition.entity";

/**
 * One entry of interceptor_type.estimated_success_rate, whose column comment
 * in hatzot_schema_v2.sql defines it as an array of these.
 */
export type EstimatedSuccessRate = {
  droneType: string;
  successRate: number;
};

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
  estimatedSuccessRate!: EstimatedSuccessRate[] | null;

  @Column({ type: "smallint", nullable: true })
  capacity!: number;

  @OneToMany(
    () => LauncherAmmunition,
    (launcherAmmunition) => launcherAmmunition.interceptorType
  )
  launcherAmmunitions!: LauncherAmmunition[];
}