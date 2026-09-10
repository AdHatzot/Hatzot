import { redis } from "./redis.client";

const THREATENED_TTL_SECONDS = 10 * 60;
const SIREN_KEY_PREFIX = "siren:";
const THREATENED_KEY_PREFIX = "threatened:";

const getThreatenedKey = (cityId: string): string => {
  return `${THREATENED_KEY_PREFIX}${cityId}`;
};

type ThreatenedPayload = {
  cityId: number;
  timestamp: number;
};

const getUnixTimestamp = (): number => Math.floor(Date.now() / 1000);

const setThreatenedJson = async (
  key: string,
  payload: ThreatenedPayload,
): Promise<void> => {
  await redis.sendCommand(["JSON.SET", key, "$", JSON.stringify(payload)]);
};

const moveExpiredSirenToThreatened = async (
  cityId: string,
): Promise<void> => {
  const threatenedPayload: ThreatenedPayload = {
    cityId: Number(cityId),
    timestamp: getUnixTimestamp(),
  };
  await setThreatenedJson(getThreatenedKey(cityId), threatenedPayload);
  await redis.expire(getThreatenedKey(cityId), THREATENED_TTL_SECONDS);
};

export const startAlertsListener = async (): Promise<void> => {
  const expiryListener = redis.duplicate();

  expiryListener.on("error", (err) => {
    console.error("Redis expiry listener error:", err);
  });

  await expiryListener.connect();

  await redis.sendCommand(["CONFIG", "SET", "notify-keyspace-events", "Ex"]);

  await expiryListener.pSubscribe("__keyevent@*__:expired", (key) => {
    if (!key.startsWith(SIREN_KEY_PREFIX)) {
      return;
    }

    const cityId = key.slice(SIREN_KEY_PREFIX.length);
    if (!cityId || !Number.isInteger(Number(cityId))) {
      return;
    }

    void moveExpiredSirenToThreatened(cityId)
      .catch((err: unknown) => {
        console.error(`Failed to restore ${cityId} to threatened:`, err);
      });
  });

  console.log("Alerts Redis listener started");
};
