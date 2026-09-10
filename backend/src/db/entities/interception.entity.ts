import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { InterceptorType } from "./InterceptorType.entity";
import { Drone } from "./red/drone.entity";

export enum InterceptionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  ABORTED = "ABORTED",
}

export enum InterceptionResult {
  HIT = "HIT",
  MISS = "MISS",
}

@Entity("interception")
export class Interception {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "live_launcher_id", type: "bigint" })
  liveLauncherId!: number;

  @Column({ name: "interceptor_type_id", type: "smallint" })
  interceptorTypeId!: number;

  @ManyToOne(() => InterceptorType)
  @JoinColumn({ name: "interceptor_type_id" })
  interceptorType!: InterceptorType;

  @Column({ name: "drone_id", type: "bigint" })
  droneId!: number;

  @ManyToOne(() => Drone)
  @JoinColumn({ name: "drone_id" })
  drone!: Drone;

  @Column({ name: "launched_at", type: "timestamptz" })
  launchedAt!: Date;

  @Column({
    name: "interceptor_longitude",
    type: "double precision",
    nullable: true,
  })
  interceptorLongitude!: number | null;

  @Column({
    name: "interceptor_latitude",
    type: "double precision",
    nullable: true,
  })
  interceptorLatitude!: number | null;

  @Column({ name: "priority", type: "smallint", nullable: true })
  priority!: number | null;

  @Column({
    name: "status",
    type: "enum",
    enum: InterceptionStatus,
    enumName: "interception_status",
    default: InterceptionStatus.PENDING,
  })
  status!: InterceptionStatus;

  @Column({
    name: "result",
    type: "enum",
    enum: InterceptionResult,
    enumName: "interception_result",
    nullable: true,
  })
  result!: InterceptionResult | null;
}