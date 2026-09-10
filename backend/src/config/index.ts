const config = {
  PORT: parseInt(process.env.PORT!) || 3000,
  DB_HOST: process.env.DB_HOST! || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT!) || 5432,
  DB_NAME: process.env.DB_NAME! || "postgres",
  DB_USERNAME: process.env.DB_USERNAME! || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD! || "postgres",
  DB_SCHEMA: process.env.DB_SCHEMA! || "hatzot",
  DB_SSL: process.env.DB_SSL === "true",
  NODE_ENV: process.env.NODE_ENV || "production",
};

export default config;