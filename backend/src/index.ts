import "reflect-metadata";

/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-09
 *
 * Bootstrap: express app + http server + ws hub. One app.use per team; the
 * per-team work lives in routes/ → controllers/ → services/ → repositories/.
 */
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { initDatabase } from "./db";
import { startAlertsListener } from "./redis/alerts.listener";
import { redis } from "./redis/redis.client";
import { alertsRoutes } from "./routes/alerts.routes";
import { blueRoutes } from "./routes/blue.routes";
import { logisticsRoutes } from "./routes/logistics.routes";
import { loopRoutes } from "./routes/loop.routes";
import { redRoutes } from "./routes/red.routes";
import { startDroneAlertsTicker } from "./services/alerts.service";
import { startBlueReloadTicker } from "./services/blue.service";
import { attachHub } from "./ws";

import { interceptionsRoutes } from "./routes/interceptions.routes";
import { errorHandler } from "./shared/errorHandler";

const PORT = Number(process.env.PORT ?? 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use("/api/red", redRoutes);
app.use("/api/blue", blueRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/interceptions", interceptionsRoutes);

// Rejections from asyncHandler land here — JSON, never Express's HTML page.
app.use(errorHandler);

async function main(): Promise<void> {
  await initDatabase();
  // Connect to Redis
  await redis.connect();

  // Start listening for alert changes
  await startAlertsListener();
  const server = createServer(app);
  attachHub(server);
  startBlueReloadTicker();
  startDroneAlertsTicker();
  server.listen(PORT, () => {
    console.log(
      `c2-backend  http://localhost:${PORT}  ws://localhost:${PORT}/ws`,
    );
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
