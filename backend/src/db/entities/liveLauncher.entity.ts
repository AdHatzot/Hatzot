import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { LauncherType } from "./launcherType.entity";
import { Deployment } from "./deployment.entity";
import { LauncherAmmunition } from "./launcherAmmunition.entity";

@Entity({ schema: "hatzot", name: "live_launcher" })
export class LiveLauncher {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @Column({ type: "smallint", name: "launcher_type_id" })
  launcherTypeId!: number;

  @Column({ type: "smallint", name: "deployment_id" })
  deploymentId!: number;

  @Column({ type: "double precision", nullable: true })
  longitude!: number;

  @Column({ type: "double precision", nullable: true })
  latitude!: number;

  @Column({ type: "double precision", nullable: true })
  asl!: number;

  @Column({ type: "double precision", nullable: true })
  agl!: number;

  @Column({ type: "integer", nullable: true })
  amount!: number;

  @Column({ type: "boolean", nullable: true })
  active!: boolean;

  // Relationships
  @ManyToOne(() => LauncherType, (launcherType) => launcherType.liveLaunchers)
  @JoinColumn({ name: "launcher_type_id" })
  launcherType!: LauncherType;

  @ManyToOne(() => Deployment, (deployment) => deployment.liveLaunchers)
  @JoinColumn({ name: "deployment_id" })
  deployment!: Deployment;

  @OneToMany(
    () => LauncherAmmunition,
    (launcherAmmunition) => launcherAmmunition.launcher
  )
  launcherAmmunitions!: LauncherAmmunition[];
}