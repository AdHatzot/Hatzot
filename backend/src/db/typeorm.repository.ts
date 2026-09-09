/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-09
 *
 * Tomorrow's adapter: TypeORM's Repository behind the Repository<T> port.
 * Placeholder until `typeorm` is installed (steps in data-source.ts). The
 * finished adapter is below. It resolves the ORM repository lazily because
 * `getRepository()` is only valid after `dataSource.initialize()`, and team
 * repositories are created at import time.
 */

import type { FindOptionsWhere, ObjectLiteral, Repository as OrmRepository } from "typeorm";
import { dataSource } from "./data-source";
import type { Identifiable, Repository } from "./repository";

export class TypeOrmRepository<T extends Identifiable & ObjectLiteral> implements Repository<T> {
    private orm: OrmRepository<T> | null = null;

    constructor(private readonly entity: string) {}

    private get repo(): OrmRepository<T> {
    return (this.orm ??= dataSource.getRepository<T>(this.entity));
    }

    findAll(): Promise<T[]> {
    return this.repo.find();
    }

    findById(id: string): Promise<T | null> {
    return this.repo.findOneBy({ id } as unknown as FindOptionsWhere<T>);
    }

    save(row: T): Promise<T> {
    return this.repo.save(row);
    }

    saveMany(rows: readonly T[]): Promise<T[]> {
    return this.repo.save([...rows]);
    }

    async remove(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
    }

    count(): Promise<number> {
    return this.repo.count();
    }
}