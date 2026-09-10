import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://default:Mg1PzLeAUfvKscqFyxvVoskdZMkLlC2D@record-sincere-retrofast-43156.db.redis.io:10926",
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
