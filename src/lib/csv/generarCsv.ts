import { escaparCsv } from "@/lib/domain/formato";

export interface ColumnaCsv<T> {
  encabezado: string;
  valor: (fila: T) => string | number | null | undefined;
}

export function generarCsv<T>(filas: T[], columnas: ColumnaCsv<T>[]): string {
  const encabezado = columnas.map((c) => escaparCsv(c.encabezado)).join(",");
  const lineas = filas.map((fila) => columnas.map((c) => escaparCsv(c.valor(fila))).join(","));
  return [encabezado, ...lineas].join("\r\n");
}
