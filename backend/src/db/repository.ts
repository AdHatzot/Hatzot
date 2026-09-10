/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-09
 *
 * The persistence port. Services depend on this interface and nothing else —
 * not on TypeORM, not on the in-memory Map. Every method is async and maps
 * 1:1 onto TypeORM's Repository (find / findOneBy / save / delete / count), so
 * the adapter swap never touches a service.
 *
 * Rule for callers: always `save()` after mutating a row. The in-memory
 * adapter hands out live references, so a forgotten save "works" today and
 * silently stops working the day the database lands.
 */
export interface Identifiable {
  id: string;
}

export interface Repository<T extends Identifiable> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(row: T): Promise<T>;
  saveMany(rows: readonly T[]): Promise<T[]>;
  remove(id: string): Promise<boolean>;
  count(): Promise<number>;
}
