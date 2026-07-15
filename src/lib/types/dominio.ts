import type { EstadoCumplimiento, NivelRiesgo } from "@/lib/domain/riesgo";
import type { FuenteFechaFab } from "@/lib/domain/fechaFabricacion";

export type { EstadoCumplimiento };

export interface CoberturaDatos {
  totalLineas: number;
  conFechaFabricacion: number;
  pctCobertura: number | null;
  sinCabeceraVenta: number;
  notasCredito: number;
}

export interface PuntoMensualLeadTime {
  mes: string; // YYYY-MM
  n: number;
  promedio: number | null;
  mediana: number | null;
  p95: number | null;
  coberturaPct: number | null;
}

export interface LeadTimePorFamilia {
  familia: string;
  n: number;
  promedio: number | null;
  mediana: number | null;
  p95: number | null;
}

export interface LeadTimePorProducto {
  idProd: string;
  detalle: string;
  familia: string | null;
  n: number;
  promedio: number | null;
  mediana: number | null;
  p95: number | null;
  leadtimePermitido: number | null;
  estadoCumplimiento: EstadoCumplimiento;
}

export interface PartidaCamara {
  idPartistock: string;
  idProd: string;
  detalle: string;
  familia: string | null;
  lote: string | null;
  venc: string | null;
  presentacion: number | null;
  origen: string | null;
  fechaFabricacion: string | null;
  diasEnCamara: number | null;
  fuenteFecha: FuenteFechaFab;
  fechaFabConfiable: boolean;
  leadtimePermitido: number | null;
  nivelRiesgo: NivelRiesgo;
  pctConsumido: number | null;
  accionSugerida: string;
}

export interface ResumenKpis {
  leadTimePromedioMes: number | null;
  leadTimeMedianaMes: number | null;
  coberturaFechaFabPct: number | null;
  partidasCamaraTotal: number;
  partidasEnRiesgo: number;
  partidasCriticas: number;
  productosSinParametro: number;
}
