/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 */
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("drone_type")
export class DroneType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ type: "numeric" })
  price!: string;
}
