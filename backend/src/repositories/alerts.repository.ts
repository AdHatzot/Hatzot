/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — the alerts shape arrives with the feed. When it does:
 *
 *   1. describe the entity in src/db/entities/alerts.entity.ts (extends Identifiable)
 *   2. optional seed rows in src/db/seed/alerts.seed.ts
 *   3. export const alertsRepository: Repository<YourEntity> =
 *        createRepository<YourEntity>("YourEntity", SEED);
 *
 * See repositories/blue.repository.ts for the worked example.
 */

// alerts.repository.ts

import { redisClient } from "../config/redis";

export const getSirenAlerts = async (): Promise<string[]> => {
  const alerts: string[] = [];

  let cursor = 0;

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: "siren:*",
      COUNT: 100,
    });

    cursor = result.cursor;
    alerts.push(...result.keys);
  } while (cursor !== 0);

  return alerts;
};

export const getThreatenedAlerts = async (): Promise<string[]> => {
  const alerts: string[] = [];

  let cursor = 0;

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: "threatened:*",
      COUNT: 100,
    });

    cursor = result.cursor;
    alerts.push(...result.keys);
  } while (cursor !== 0);

  return alerts;
};
