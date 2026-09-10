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
import { createServer } from "node:http";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { attachHub } from "./ws";
import { initDatabase } from "./db";
import { redRoutes } from "./routes/red.routes";
import { blueRoutes } from "./routes/blue.routes";
import { alertsRoutes } from "./routes/alerts.routes";
import { logisticsRoutes } from "./routes/logistics.routes";
import { loopRoutes } from "./routes/loop.routes";
import { startBlueReloadTicker } from "./services/blue.service";
import { startDroneAlertsTicker } from "./services/alerts.service";

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

// Rejections from asyncHandler land here — JSON, never Express's HTML page.
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
};
app.use(onError);

async function main(): Promise<void> {
  await initDatabase();
  const server = createServer(app);
  attachHub(server);
  startBlueReloadTicker();
  //startDroneAlertsTicker();
  server.listen(PORT, () => {
    console.log(`c2-backend  http://localhost:${PORT}  ws://localhost:${PORT}/ws`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
