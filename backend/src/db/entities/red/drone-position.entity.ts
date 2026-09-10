/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 */
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Drone } from "./drone.entity";

@Entity("drone_position")
export class DronePosition {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @OneToOne(() => Drone, (drone) => drone.position)
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
