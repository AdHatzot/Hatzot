import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { LiveLauncher } from "./liveLauncher.entity";
import { InterceptorType } from "./InterceptorType.entity";

@Entity({ schema: "hatzot", name: "launcher_ammunition" })
export class LauncherAmmunition {
  @PrimaryColumn({ type: "bigint", name: "launcher_id" })
  launcherId!: string;

  @PrimaryColumn({ type: "smallint", name: "interceptor_type_id" })
  interceptorTypeId!: number;

  @Column({ type: "integer", nullable: true })
  quantity!: number;

  // Relationships
  @ManyToOne(
    () => LiveLauncher,
    (liveLauncher) => liveLauncher.launcherAmmunitions
  )
  @JoinColumn({ name: "launcher_id" })
  launcher!: LiveLauncher;

  @ManyToOne(
    () => InterceptorType,
    (interceptorType) => interceptorType.launcherAmmunitions
  )
  @JoinColumn({ name: "interceptor_type_id" })
  interceptorType!: InterceptorType;
}