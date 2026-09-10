/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-10
 */
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { DroneType } from "./drone-type.entity";
import { DronePosition } from "./drone-position.entity";

@Entity("drone")
export class Drone {
  @PrimaryColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "text", name: "drone_id", unique: true })
  droneId!: string;

  @ManyToOne(() => DroneType, { nullable: false })
  @JoinColumn({ name: "drone_type_id" })
  droneType!: DroneType;

  /** Track history, one row per pull. Never load it for the whole table. */
  @OneToMany(() => DronePosition, (position) => position.drone)
  positions?: DronePosition[];

  @Column({ type: "numeric" })
  heading!: string;

  @Column({ type: "numeric" })
  velocity!: string;
}
