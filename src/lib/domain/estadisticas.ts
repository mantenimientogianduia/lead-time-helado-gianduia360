export function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const suma = valores.reduce((acc, v) => acc + v, 0);
  return suma / valores.length;
}

export function mediana(valores: number[]): number | null {
  return percentil(valores, 50);
}

/** Percentil por interpolación lineal (método "linear" de numpy/Excel). */
export function percentil(valores: number[], p: number): number | null {
  if (valores.length === 0) return null;
  if (p < 0 || p > 100) {
    throw new Error(`Percentil invalido: ${p}. Debe estar entre 0 y 100.`);
  }

  const ordenados = [...valores].sort((a, b) => a - b);
  if (ordenados.length === 1) return ordenados[0] ?? null;

  const rank = (p / 100) * (ordenados.length - 1);
  const indiceInferior = Math.floor(rank);
  const indiceSuperior = Math.ceil(rank);
  const inferior = ordenados[indiceInferior];
  const superior = ordenados[indiceSuperior];

  if (inferior === undefined || superior === undefined) return null;
  if (indiceInferior === indiceSuperior) return inferior;

  const fraccion = rank - indiceInferior;
  return inferior + (superior - inferior) * fraccion;
}

export interface ResumenEstadistico {
  n: number;
  promedio: number | null;
  mediana: number | null;
  p90: number | null;
  /** Percentil 95: el más usado operativamente para monitorear cola de riesgo de este indicador. */
  p95: number | null;
}

export function resumenEstadistico(valores: number[]): ResumenEstadistico {
  return {
    n: valores.length,
    promedio: promedio(valores),
    mediana: mediana(valores),
    p90: percentil(valores, 90),
    p95: percentil(valores, 95),
  };
}
