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
import { redis } from "../redis/redis.client";

export type AlertType = "siren" | "threatened";

export type AlertStatus = {
	type: AlertType;
	cityId: number;
};

const ALERT_KEY_PREFIXES: ReadonlyArray<{
	type: AlertType;
	prefix: string;
}> = [
	{ type: "siren", prefix: "siren:" },
	{ type: "threatened", prefix: "threatened:" },
];

const getCityIdFromKey = (key: string, prefix: string): number | null => {
	const cityId = Number(key.slice(prefix.length));
	return Number.isInteger(cityId) && cityId > 0 ? cityId : null;
};

const scanKeys = async (pattern: string): Promise<string[]> => {
	const keys: string[] = [];

	for await (const batch of redis.scanIterator({ MATCH: pattern })) {
		keys.push(...batch);
	}

	return keys;
};

export const getAlertStatus = async (): Promise<AlertStatus[]> => {
	const statuses = await Promise.all(
		ALERT_KEY_PREFIXES.map(async ({ type, prefix }) => {
			const keys = await scanKeys(`${prefix}*`);

			return keys.flatMap((key): AlertStatus[] => {
				const cityId = getCityIdFromKey(key, prefix);
				return cityId === null ? [] : [{ type, cityId }];
			});
		}),
	);

	return statuses.flat();
};
