/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 */
import type { Identifiable } from "../../repository";
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { DroneType } from "./drone-type.entity";
import { DronePosition } from "./drone-position.entity";

@Entity("drone")
export class Drone implements Identifiable {
  @PrimaryColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "text", name: "drone_id", unique: true })
  droneId!: string;

  @ManyToOne(() => DroneType, { nullable: false })
  @JoinColumn({ name: "drone_type_id" })
  droneType!: DroneType;

  @OneToOne(() => DronePosition, (position) => position.drone, {
    cascade: ["insert", "update"],
  })
  position?: DronePosition;

  @Column({ type: "numeric" })
  heading!: string;

  @Column({ type: "numeric" })
  velocity!: string;
}
