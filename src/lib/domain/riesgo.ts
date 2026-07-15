export type NivelRiesgo = "ok" | "riesgo" | "critico" | "sin_parametro";

export interface EvaluacionRiesgo {
  nivel: NivelRiesgo;
  /** Porcentaje del leadtime_permitido ya consumido. null cuando no hay parametro definido. */
  pctConsumido: number | null;
  accionSugerida: string;
}

export const UMBRAL_RIESGO_PCT = 70;
export const UMBRAL_CRITICO_PCT = 100;

const ACCIONES: Record<NivelRiesgo, string> = {
  ok: "Sin acción requerida.",
  riesgo: "Priorizar salida en los próximos despachos.",
  critico: "Revisar de inmediato: evaluar traslado, promoción o baja.",
  sin_parametro: "Definir lead time permitido para este producto.",
};

export function clasificarRiesgo(
  diasTranscurridos: number,
  leadtimePermitido: number | null | undefined
): EvaluacionRiesgo {
  if (leadtimePermitido == null || leadtimePermitido <= 0) {
    return { nivel: "sin_parametro", pctConsumido: null, accionSugerida: ACCIONES.sin_parametro };
  }

  const pctConsumido = (diasTranscurridos / leadtimePermitido) * 100;

  let nivel: NivelRiesgo;
  if (pctConsumido > UMBRAL_CRITICO_PCT) {
    nivel = "critico";
  } else if (pctConsumido >= UMBRAL_RIESGO_PCT) {
    nivel = "riesgo";
  } else {
    nivel = "ok";
  }

  return { nivel, pctConsumido, accionSugerida: ACCIONES[nivel] };
}

export type EstadoCumplimiento = "cumple" | "excede" | "sin_parametro";

/** Compara un lead time promedio/mediana historico contra el leadtime_permitido del producto. */
export function clasificarCumplimiento(
  diasLeadTime: number,
  leadtimePermitido: number | null | undefined
): EstadoCumplimiento {
  if (leadtimePermitido == null || leadtimePermitido <= 0) return "sin_parametro";
  return diasLeadTime <= leadtimePermitido ? "cumple" : "excede";
}
