import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { DroneType } from "./droneType.entity";

@Entity("drone")
export class Drone {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "drone_type_id", type: "smallint" })
  droneTypeId!: number;

  @ManyToOne(() => DroneType)
  @JoinColumn({ name: "drone_type_id" })
  droneType!: DroneType;

  @Column({ name: "heading", type: "double precision" })
  heading!: number;

  @Column({ name: "velocity", type: "double precision" })
  velocity!: number;
}