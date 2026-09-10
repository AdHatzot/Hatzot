/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * One row per drone per pull of the feed — the track history route
 * calculation reads. A drone has many of these, newest by recorded_at.
 */
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Drone } from "./drone.entity";

@Entity("drone_position")
export class DronePosition {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @ManyToOne(() => Drone, (drone) => drone.positions, { nullable: false })
  @JoinColumn({ name: "drone_id" })
  drone!: Drone;

  @Column({ type: "numeric" })
  longitude!: string;

  @Column({ type: "numeric" })
  latitude!: string;

  @Column({ type: "numeric" })
  asl!: string;

  @Column({ type: "numeric" })
  agl!: string;

  @Column({ type: "timestamptz", name: "recorded_at" })
  recordedAt!: Date;
}
