import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("deployment")
export class Deployment {
  @PrimaryGeneratedColumn({ name: "id"})
  id!: number;

  @Column({ name: "name", type: "text"})
  name!: string;

  @Column( { name: "status", type: "text"})
  status!: string;
}