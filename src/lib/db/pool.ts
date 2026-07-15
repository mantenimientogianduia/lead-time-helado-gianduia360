import { Pool } from "pg";
import { loadDbConfig } from "./config";

declare global {
  // eslint-disable-next-line no-var
  var __g360Pool: Pool | undefined;
}

export function getPool(): Pool {
  if (global.__g360Pool) {
    return global.__g360Pool;
  }

  const config = loadDbConfig();

  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: config.sslRejectUnauthorized } : false,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 3_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
    application_name: "lead_time_helado_dashboard",
  });

  pool.on("error", (err) => {
    console.error("Error inesperado en el pool de PostgreSQL G360", err);
  });

  global.__g360Pool = pool;
  return pool;
}
