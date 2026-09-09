import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("drone_position")
export class DronePosition {
  @PrimaryGeneratedColumn({ name: "id"})
  id!: number;

  @Column({ name: "drone_id", type: "int"})
  droneId!: number;

  @Column( { name: "heading", type: "double precision"})
  heading!: number;

  @Column( { name: "velocity", type: "double precision"})
  velocity!: number;
}