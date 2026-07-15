# Lead Time Helado — Gianduia360

Dashboard interno para seguir el indicador de lead time (fabricación → venta) de producto
terminado helado. Conexión en vivo, solo lectura, contra `gianduia360-bbdd` (esquema `g360`).

Dos vistas:

- **Resumen**: evolución mensual del lead time real de ventas (mediana/promedio/p90), desglose por
  familia, cobertura de datos.
- **Cámara en vivo**: partidas actualmente en depósito 8, su antigüedad, nivel de riesgo respecto
  al `leadtime_permitido` de cada producto y acción sugerida.

## Uso local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Variables de entorno

Copiar `.env.example` a `.env`:

```txt
G360_DB_HOST=
G360_DB_PORT=5432
G360_DB_NAME=
G360_DB_USER=
G360_DB_PASSWORD=
G360_DB_SSLMODE=require
G360_DB_SSL_REJECT_UNAUTHORIZED=true
```

`G360_DB_SSL_REJECT_UNAUTHORIZED` debe quedar en `false` solo si el host de Postgres usa un
certificado que no valida (ver `docs/supuestos-y-limitaciones.md`).

## Verificación de esquema (Fase 0)

Antes de tocar las queries, correr contra la base real:

```bash
npm run verificar-esquema
```

Documentado en `docs/modelo-datos.md`.

## Tests

```bash
npm run test
npm run typecheck
```

## Estructura

- `src/app/(dashboard)/`: pantallas (Resumen, Cámara en vivo).
- `src/app/api/`: endpoints (resumen, historico, camara, exports, salud).
- `src/lib/repositories/`: SQL parametrizado contra `g360`.
- `src/lib/domain/`: funciones puras (estadística, riesgo, resolución de fecha de fabricación).
- `docs/modelo-datos.md`: hallazgos de la verificación de esquema en vivo.
- `docs/supuestos-y-limitaciones.md`: decisiones de negocio y limitaciones de datos conocidas.

## Deploy

Pensada para Vercel + GitHub. Variables de entorno se configuran en el proyecto de Vercel, nunca
en el repositorio. El driver `pg` corre server-side únicamente (`export const runtime = "nodejs"`
en cada route handler); el navegador nunca recibe credenciales, SQL ni errores técnicos.
