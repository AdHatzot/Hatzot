import { redis } from "./redis.client";

export async function startAlertsListener() {
  const monitor = redis.duplicate();

  monitor.on("error", (err) => {
    console.error("Redis monitor error:", err);
  });

  await monitor.connect();

  await monitor.monitor((message) => {
    console.log("Redis monitor:", message);

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

    void redis.sAdd("siren", cityId);
  });

  console.log("Alerts Redis listener started");
}
