import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LiveLauncher } from "./liveLauncher.entity";

@Entity({ schema: "hatzot", name: "launcher_type" })
export class LauncherType {
  @PrimaryGeneratedColumn({ type: "smallint" })
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ type: "numeric", name: "reload_time_s", nullable: true })
  reloadTimeS!: number;

  @Column({ type: "integer", name: "range_m", nullable: true })
  rangeM!: number;

  @OneToMany(() => LiveLauncher, (liveLauncher) => liveLauncher.launcherType)
  liveLaunchers!: LiveLauncher[];
}