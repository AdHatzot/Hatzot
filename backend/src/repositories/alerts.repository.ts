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
	cityName?: string;
	timestamp?: number;
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

const getCityName = async (key: string): Promise<string | undefined> => {
	const value = await redis.sendCommand(["JSON.GET", key, "$.cityName"]);
	if (typeof value !== "string" || !value) {
		return undefined;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) && typeof parsed[0] === "string"
			? parsed[0]
			: undefined;
	} catch {
		return undefined;
	}
};

const getAlertTimestamp = async (key: string): Promise<number | undefined> => {
	const value = await redis.sendCommand(["JSON.GET", key, "$.timestamp"]);
	if (typeof value !== "string" || !value) {
		return undefined;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		const timestamp = Array.isArray(parsed) ? parsed[0] : undefined;
		return typeof timestamp === "number" && Number.isFinite(timestamp)
			? timestamp
			: undefined;
	} catch {
		return undefined;
	}
};

export const getAlertStatus = async (): Promise<AlertStatus[]> => {
	const statuses = await Promise.all(
		ALERT_KEY_PREFIXES.map(async ({ type, prefix }) => {
			const keys = await scanKeys(`${prefix}*`);

			return Promise.all(keys.flatMap(async (key): Promise<AlertStatus[]> => {
				const cityId = getCityIdFromKey(key, prefix);
				if (cityId === null) {
					return [];
				}

				const cityName = await getCityName(key);
				const timestamp = await getAlertTimestamp(key);
				return [
					{
						type,
						cityId,
						...(cityName ? { cityName } : {}),
						...(timestamp !== undefined ? { timestamp } : {}),
					},
				];
			})).then((entries) => entries.flat());
		}),
	);

	const statusByCity = new Map<number, AlertStatus>();
	for (const status of statuses.flat()) {
		const current = statusByCity.get(status.cityId);
		if (!current || status.type === "siren") {
			statusByCity.set(status.cityId, status);
		}
	}

	return [...statusByCity.values()];
};
