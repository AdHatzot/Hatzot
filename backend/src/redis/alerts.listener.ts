import { redis } from "./redis.client";

const THREATENED_TTL_SECONDS = 10 * 60;
const RECOVERY_TTL_SECONDS = 60 * 60;
const SIREN_KEY_PREFIX = "siren:";
const THREATENED_KEY_PREFIX = "threatened:";
const SIREN_RECOVERY_KEY_PREFIX = "siren:recovery:";

const getSirenKey = (cityId: string): string => {
  return `${SIREN_KEY_PREFIX}${cityId}`;
};

const getThreatenedKey = (cityId: string): string => {
  return `${THREATENED_KEY_PREFIX}${cityId}`;
};

const getSirenRecoveryKey = (cityId: string): string => {
  return `${SIREN_RECOVERY_KEY_PREFIX}${cityId}`;
};

type AlertPayload = {
  cityName: string;
  timestamp: number;
};

const getUnixTimestamp = (): number => Math.floor(Date.now() / 1000);

const isAlertPayload = (value: unknown): value is AlertPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.cityName === "string" &&
    typeof payload.timestamp === "number"
  );
};

const parseAlertPayload = (value: string): AlertPayload | null => {
  try {
    const parsed: unknown = JSON.parse(value);
    return isAlertPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const getJson = async (key: string): Promise<AlertPayload | null> => {
  const value = await redis.sendCommand(["JSON.GET", key, "$"]);
  if (typeof value !== "string" || !value) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length !== 1) {
    return null;
  }

  return isAlertPayload(parsed[0]) ? parsed[0] : null;
};

const setJson = async (key: string, payload: AlertPayload): Promise<void> => {
  await redis.sendCommand(["JSON.SET", key, "$", JSON.stringify(payload)]);
};

const moveCityToSiren = async (cityId: string): Promise<void> => {
  const payload =
    (await getJson(getThreatenedKey(cityId))) ?? {
      cityName: cityId,
      timestamp: getUnixTimestamp(),
    };
  const payloadJson = JSON.stringify(payload);

  await setJson(getSirenKey(cityId), payload);
  await redis.set(getSirenRecoveryKey(cityId), payloadJson, {
    EX: RECOVERY_TTL_SECONDS,
  });
  await redis.del(getThreatenedKey(cityId));
};

const moveExpiredSirenToThreatened = async (
  cityId: string,
): Promise<void> => {
  const recoveryPayload = await redis.get(getSirenRecoveryKey(cityId));
  const payload = recoveryPayload
    ? parseAlertPayload(recoveryPayload)
    : null;
  const threatenedPayload: AlertPayload = payload ?? {
    cityName: cityId,
    timestamp: getUnixTimestamp(),
  };

  threatenedPayload.timestamp = getUnixTimestamp();
  await setJson(getThreatenedKey(cityId), threatenedPayload);
  await redis.expire(getThreatenedKey(cityId), THREATENED_TTL_SECONDS);
  await redis.del(getSirenRecoveryKey(cityId));
};

export const startAlertsListener = async (): Promise<void> => {
  const monitor = redis.duplicate();
  const expiryListener = redis.duplicate();

  monitor.on("error", (err) => {
    console.error("Redis monitor error:", err);
  });
  expiryListener.on("error", (err) => {
    console.error("Redis expiry listener error:", err);
  });

  await monitor.connect();
  await expiryListener.connect();

  await redis.sendCommand(["CONFIG", "SET", "notify-keyspace-events", "Ex"]);

  await expiryListener.pSubscribe("__keyevent@*__:expired", (key) => {
    if (
      !key.startsWith(SIREN_KEY_PREFIX) ||
      key.startsWith(SIREN_RECOVERY_KEY_PREFIX)
    ) {
      return;
    }

    const cityId = key.slice(SIREN_KEY_PREFIX.length);
    if (!cityId) {
      return;
    }

    void moveExpiredSirenToThreatened(cityId)
      .catch((err: unknown) => {
        console.error(`Failed to restore ${cityId} to threatened:`, err);
      });
  });

  await monitor.monitor((message) => {
    // message is the raw MONITOR output
    if (!message.includes('SREM "threatened"')) {
      return;
    }

    const match = message.match(
      /SREM "threatened" "([^"]+)"/,
    );

    if (!match) {
      return;
    }

    const cityId = match[1];

    console.log(
      `City ${cityId} removed from threatened → adding to siren`,
    );

    void moveCityToSiren(cityId).catch((err: unknown) => {
      console.error(`Failed to move ${cityId} to siren:`, err);
    });
  });

  console.log("Alerts Redis listener started");
};
