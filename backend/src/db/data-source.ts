/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-09
 *
 * TypeORM DataSource — placeholder. The database is "next, not now"
 * (context.md), so `typeorm` is not a dependency yet and this file only reads
 * the env. Wiring it up is five steps, none of which touch a team folder:
 *
 *   1. pnpm add typeorm reflect-metadata <driver>        # pg, better-sqlite3 …
 *   2. tsconfig.json: "experimentalDecorators": true, "emitDecoratorMetadata": true
 *   3. src/index.ts: `import "reflect-metadata";` as the first line
 *   4. replace the body of this file with
 *
 *        import { DataSource } from "typeorm";
 *        import { Battery } from "./entities/blue.entity";   // one import per entity
 *
 *        export const dataSource = new DataSource({
 *          type: "postgres",
 *          url: process.env.DB_URL,
 *          entities: [Battery],
 *          synchronize: false,                 // migrations only — never sync in prod
 *          migrations: ["dist/db/migrations/*.js"],
 *        });
 *
 *   5. turn on the TypeORM branches in db/index.ts and db/typeorm.repository.ts.
 */
import { DataSource } from "typeorm";
import config from "../config";
import { Deployment } from "./entities/deployment.entity";
import { InterceptorType } from "./entities/InterceptorType.entity";
import { LauncherAmmunition } from "./entities/launcherAmmunition.entity";
import { LauncherType } from "./entities/launcherType.entity";
import { LiveLauncher } from "./entities/liveLauncher.entity";

//add to .env
// PORT=3000
// DB_HOST=localhost
// DB_PORT=5433
// DB_NAME=postgres
// DB_USERNAME=postgres
// DB_PASSWORD=postgres
// DB_SCHEMA=hatzot
// NODE_ENV=dev

export const dataSource = new DataSource({
  type: "postgres",
  entities: [
    Deployment,
    LiveLauncher,
    LauncherType,
    LauncherAmmunition,
    InterceptorType,
  ],
  synchronize: false,
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  schema: config.DB_SCHEMA,
  logging: true,
  migrations: ["dist/db/migrations/*.js"],
  subscribers: [],
  ssl: config.NODE_ENV === "production" || config.NODE_ENV === "development",
});

export function isDatabaseConfigured(): boolean {
  const url = process.env.DB_URL;
  return url !== undefined && url.length > 0;
}
