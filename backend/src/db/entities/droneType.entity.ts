import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("drone_type")
export class DroneType {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "name", type: "text", unique: true })
  name!: string;

  @Column({ name: "price", type: "integer" })
  price!: number;
}