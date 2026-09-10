/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 */
import type { Identifiable } from "../../repository";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("drone_type")
export class DroneType implements Identifiable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ type: "numeric" })
  price!: string;
}
