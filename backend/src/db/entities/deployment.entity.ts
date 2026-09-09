import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LiveLauncher } from "./liveLauncher.entity";

export enum DeploymentStatus {
  // Add your custom enum values here as defined in hatzot.deployment_status
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

@Entity({ schema: "hatzot", name: "deployment" })
export class Deployment {
  @PrimaryGeneratedColumn({ type: "integer" })
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({
    type: "enum",
    enum: DeploymentStatus,
    enumName: "hatzot.deployment_status",
  })
  status!: DeploymentStatus;

  @OneToMany(() => LiveLauncher, (liveLauncher) => liveLauncher.deployment)
  liveLaunchers!: LiveLauncher[];
}