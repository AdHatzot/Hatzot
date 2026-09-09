/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 */
import type { Identifiable } from "../../repository";
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { DroneType } from "./drone-type.entity";

@Entity("drone")
export class Drone implements Identifiable {
  @PrimaryColumn({ type: "bigint" })
  id!: string;

  @ManyToOne(() => DroneType, { nullable: false })
  @JoinColumn({ name: "drone_type" })
  droneType!: DroneType;

  @Column({ type: "numeric" })
  heading!: string;

  @Column({ type: "numeric" })
  velocity!: string;
}
