import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity("drone")
export class Drone {
  @PrimaryGeneratedColumn({ name: "id"})
  id!: number;

  @Column({ name: "drone_type_id", type: "smallint"})
  droneTypeId!: number;

  @Column( { name: "heading", type: "double precision"})
  heading!: number;

  @Column( { name: "velocity", type: "double precision"})
  velocity!: number;
}