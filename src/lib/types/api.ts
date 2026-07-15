import type {
  CoberturaDatos,
  LeadTimePorFamilia,
  LeadTimePorProducto,
  PartidaCamara,
  PuntoMensualLeadTime,
  ResumenKpis,
} from "./dominio";

export interface RespuestaHistorico {
  serieMensual: PuntoMensualLeadTime[];
  porFamilia: LeadTimePorFamilia[];
  porProducto: LeadTimePorProducto[];
  cobertura: CoberturaDatos;
  avisos: string[];
}

export interface RespuestaCamara {
  partidas: PartidaCamara[];
  total: number;
  pagina: number;
  porPagina: number;
  avisos: string[];
}

export interface RespuestaResumen {
  kpis: ResumenKpis;
  avisos: string[];
}

export interface RespuestaError {
  error: string;
}
