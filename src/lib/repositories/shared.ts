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
