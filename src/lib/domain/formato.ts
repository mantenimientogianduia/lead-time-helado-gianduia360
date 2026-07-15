const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatearNumero(valor: number | null, decimales = 1): string {
  if (valor === null || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: decimales }).format(valor);
}

export function formatearMoneda(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatearFecha(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return formatoFecha.format(fecha);
}

/** Escapa un valor para una celda CSV separada por comas, con comillas dobles si hace falta. */
export function escaparCsv(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}
