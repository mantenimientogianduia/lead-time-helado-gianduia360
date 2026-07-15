export const RUBROS_HELADO = ["PRODUCTO TERMINADO HELADO", "PRODUCTO TERMINADO PINTAS"] as const;

export const ESTADOS_VENTA_VALIDOS = ["Despachado", "Finalizado"] as const;

export const DEPOSITO_CAMARA = 8;

/** Únicas familias dentro de alcance del análisis (pedido explícito del usuario). */
export const FAMILIAS_INCLUIDAS = ["BACHA", "BALDE", "PINTAS"] as const;

/** Clausula reutilizable: solo deja pasar familias dentro de alcance. */
export function familiaIncluida(alias: string, indiceParametro: number): string {
  return `${alias}.familia = any($${indiceParametro}::text[])`;
}

/** Valor real confirmado en vivo (Fase 0): lleva tilde. No usar "Produccion" sin tilde. */
export const ORIGEN_PRODUCCION = "Producción";

/**
 * `f_detalles_ventas.lote_fabricacion` a veces queda grabado como fecha "epoch"
 * (1970-01-01/02) cuando el dato nunca se cargó, en vez de quedar NULL. Confirmado en vivo:
 * genera lead times de ~20.500 días (56 años) que arruinan cualquier promedio/percentil.
 * Cualquier fecha anterior a este corte se trata como "sin fecha de fabricación", no como 0.
 */
export const FECHA_FABRICACION_MINIMA = "2015-01-01";

/** Expresión SQL: `lote_fabricacion` solo si es una fecha plausible, si no NULL. */
export function fechaFabValida(alias: string): string {
  return `(case when ${alias}.lote_fabricacion >= '${FECHA_FABRICACION_MINIMA}' then ${alias}.lote_fabricacion else null end)`;
}

/**
 * Condición booleana para usar en `filter (where ...)`/`count(*) filter (...)`: la venta tiene
 * una fecha de fabricación utilizable para calcular lead time (no nula, no "epoch", y anterior o
 * igual a la fecha de venta — no puede venderse algo antes de fabricarlo).
 */
export function fechaFabConfiable(alias: string): string {
  return `(${alias}.lote_fabricacion is not null and ${alias}.lote_fabricacion >= '${FECHA_FABRICACION_MINIMA}' and ${alias}.fecha_venta >= ${alias}.lote_fabricacion)`;
}

/** Filtro estandar de fila activa: borrado es `text` en las tablas de este dominio. */
export function activo(alias: string): string {
  return `coalesce(btrim(${alias}.borrado::text), '') = ''`;
}

/**
 * El driver `pg` devuelve columnas `date`/`timestamp(tz)` como objetos `Date`, no strings.
 * Normaliza a ISO 8601 en el borde del repositorio para que el resto de la app (tipos,
 * formateo, CSV) trabaje siempre con `string | null`, nunca con `Date` crudo.
 */
export function aFechaISO(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  return String(valor);
}
