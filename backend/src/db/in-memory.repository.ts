/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-09
 *
 * Today's adapter: a Map seeded from db/seed. Process-local, lost on restart.
 * Replaced by typeorm.repository.ts when the database lands — nothing outside
 * db/index.ts references this class.
 */
import type { Identifiable, Repository } from "./repository";

export class InMemoryRepository<T extends Identifiable> implements Repository<T> {
  private readonly rows = new Map<string, T>();

  constructor(seed: readonly T[] = []) {
    for (const row of seed) this.rows.set(row.id, row);
  }

  async findAll(): Promise<T[]> {
    return [...this.rows.values()];
  }

  async findById(id: string): Promise<T | null> {
    return this.rows.get(id) ?? null;
  }

  async save(row: T): Promise<T> {
    this.rows.set(row.id, row);
    return row;
  }

  async saveMany(rows: readonly T[]): Promise<T[]> {
    for (const row of rows) this.rows.set(row.id, row);
    return [...rows];
  }

  async remove(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }

  async count(): Promise<number> {
    return this.rows.size;
  }
}
