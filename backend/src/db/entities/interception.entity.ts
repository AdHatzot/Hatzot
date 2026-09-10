/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Loop's own table. Follows the established entity convention (see
 * drone.entity.ts, deployment.entity.ts): no `schema` on @Entity — the
 * DataSource's `schema: config.DB_SCHEMA` (data-source.ts) already scopes
 * every entity to `hatzot` at the connection level, so this file needs no
 * changes there and is picked up automatically by the `entities` glob.
 *
 * Deliberately has NO @ManyToOne relations to live_launcher /
 * interceptor_type / drone. No correct, canonical entity exists yet for
 * those tables (drone_position.entity.ts is missing its actual columns —
 * see loop.repository.ts), so the denormalized read for the active/closed
 * screens goes through hand-written SQL there instead of ORM relations.
 * This entity is only used directly for single-row interception access
 * (e.g. a future "mark as HIT" write endpoint).
 */
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type InterceptionStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "ABORTED";
export type InterceptionResult = "HIT" | "MISS";

@Entity("interception")
export class Interception {
  // Sibling files (drone.entity.ts, drone_position.entity.ts) use
  // @PrimaryGeneratedColumn({ name: "id" }) with no `type`, which TypeORM
  // defaults to a 32-bit `int` — but the DDL defines interception.id (like
  // drone.id) as `bigint GENERATED ALWAYS AS IDENTITY`. Specifying `type`
  // explicitly here so it's read/written as bigint (comes back as a
  // string, per node-postgres convention, hence `id: string`). Worth
  // applying the same fix to the sibling entities — flagged, not changed.
  @PrimaryGeneratedColumn({ name: "id", type: "bigint" })
  id!: string;

  @Column({ name: "live_launcher_id", type: "bigint" })
  liveLauncherId!: string;

  @Column({ name: "interceptor_type_id", type: "smallint" })
  interceptorTypeId!: number;

  @Column({ name: "drone_id", type: "bigint" })
  droneId!: string;

  @Column({ name: "launched_at", type: "timestamptz" })
  launchedAt!: Date;

  @Column({ name: "interceptor_longitude", type: "double precision", nullable: true })
  interceptorLongitude!: number | null;

  @Column({ name: "interceptor_latitude", type: "double precision", nullable: true })
  interceptorLatitude!: number | null;

  @Column({ type: "smallint" })
  priority!: number;

  @Column({
    type: "enum",
    enum: ["PENDING", "IN_PROGRESS", "SUCCESS", "FAILED", "ABORTED"],
    enumName: "interception_status",
  })
  status!: InterceptionStatus;

  @Column({
    type: "enum",
    enum: ["HIT", "MISS"],
    enumName: "interception_result",
    nullable: true,
  })
  result!: InterceptionResult | null;
}