export type FuenteFechaFab = "produccion_lote_id_prod" | "ts_ingreso" | "sin_dato";

export interface ResolucionFechaFab {
  fecha: string | null;
  fuente: FuenteFechaFab;
  /** false cuando la fuente es un fallback (ts_ingreso) o no hay dato. */
  confiable: boolean;
}

export interface CandidatosFechaFab {
  fechaFabProduccionPorLote: string | null;
  tsIngreso: string | null;
}

/**
 * Resuelve la fecha de fabricación de una partida en cámara con confiabilidad decreciente:
 * 1) match por lote+id_prod contra f_partidas_op.fecha_fab (Fase 0 midió ~93% de cobertura
 *    sobre el stock real de cámara; puede tener colisiones minoritarias, ver docs/modelo-datos.md
 *    sobre el criterio de desempate usado en el repositorio);
 * 2) fallback a ts_ingreso (cuándo entró la partida a stock, no necesariamente fecha real de
 *    fabricación);
 * 3) sin dato.
 *
 * Nota: `f_partidas_op` no tiene columna `id_partistock` (confirmado en vivo en Fase 0), por lo
 * que no existe una vía de match directo por esa clave; solo queda la vía por lote+id_prod.
 */
export function resolverFechaFabricacion(input: CandidatosFechaFab): ResolucionFechaFab {
  if (input.fechaFabProduccionPorLote) {
    return {
      fecha: input.fechaFabProduccionPorLote,
      fuente: "produccion_lote_id_prod",
      confiable: true,
    };
  }

  if (input.tsIngreso) {
    return { fecha: input.tsIngreso, fuente: "ts_ingreso", confiable: false };
  }

  return { fecha: null, fuente: "sin_dato", confiable: false };
}
