/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-10
 */
import type { Location } from "../../types";

export interface CurrentDrone {
    id: number;
    heading: number;
    velocity: number;
    location: Location;
}
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("drone")
export class Drone {
    @PrimaryGeneratedColumn({ name: "id" })
    id!: number;

    @Column({ name: "drone_type_id", type: "smallint" })
    droneTypeId!: number;

    @Column({ name: "heading", type: "double precision" })
    heading!: number;

    @Column({ name: "velocity", type: "double precision" })
    velocity!: number;
}
