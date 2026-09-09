/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-09
 *
 * Persistence entry point. Teams import `createRepository` and the
 * `Repository<T>` port from here and nothing else under db/.
 *
 * `createRepository` is the one swap point for TypeORM: today it hands out an
 * in-memory store seeded from db/seed; once the database lands it hands out
 * `new TypeOrmRepository(entity)` instead, and no service, controller or
 * repository file changes. Install steps live in db/data-source.ts.
 */
import { isDatabaseConfigured, dataSource } from "./data-source";
import { InMemoryRepository } from "./in-memory.repository";
import type { Identifiable, Repository } from "./repository";
import { TypeOrmRepository } from "./typeorm.repository";

export type { Identifiable, Repository } from "./repository";

const registry = new Map<string, unknown>();

/**
 * One repository per entity, shared by everyone who asks for it.
 * `entity` is the TypeORM entity name the table registers under (e.g. "Battery").
 * `seed` is read by the in-memory adapter only.
 */
export function createRepository<T extends Identifiable>(entity: string, seed: readonly T[] = []): Repository<T> {
  const existing = registry.get(entity);
  if (existing !== undefined) return existing as Repository<T>;

  // TypeORM: 
  const repo = isDatabaseConfigured() ? new TypeOrmRepository<T>(entity) : new InMemoryRepository<T>(seed);
  // const repo: Repository<T> = new InMemoryRepository<T>(seed);
  registry.set(entity, repo);
  return repo;
}

/** Called once from src/index.ts before the server listens. */
export async function initDatabase(): Promise<void> {
  if (isDatabaseConfigured()) {
    console.warn("DB_URL is set but TypeORM is not wired yet — serving in-memory seed data.");
  }
  
  await dataSource.initialize();
}
