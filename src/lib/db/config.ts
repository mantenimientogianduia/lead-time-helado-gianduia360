export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  /**
   * Verificar la cadena de certificados TLS. Debe quedar en `true` salvo que el host
   * de Postgres use un certificado autofirmado conocido y confiable (opt-in explícito
   * vía G360_DB_SSL_REJECT_UNAUTHORIZED=false), nunca como default silencioso.
   */
  sslRejectUnauthorized: boolean;
}

export function loadDbConfig(env: NodeJS.ProcessEnv = process.env): DbConfig {
  const host = env.G360_DB_HOST ?? "";
  const database = env.G360_DB_NAME ?? "";
  const user = env.G360_DB_USER ?? "";
  const password = env.G360_DB_PASSWORD ?? "";

  if (!host || !database || !user || !password) {
    throw new Error(
      "Faltan variables de entorno G360_DB_* (host, name, user o password) para conectar a la base."
    );
  }

  return {
    host,
    port: Number(env.G360_DB_PORT ?? 5432),
    database,
    user,
    password,
    ssl: (env.G360_DB_SSLMODE ?? "require") !== "disable",
    sslRejectUnauthorized: env.G360_DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}
