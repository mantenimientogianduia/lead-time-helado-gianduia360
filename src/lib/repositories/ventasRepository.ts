import { getPool } from "@/lib/db/pool";
import { resumenEstadistico } from "@/lib/domain/estadisticas";
import { clasificarCumplimiento } from "@/lib/domain/riesgo";
import type {
  CoberturaDatos,
  LeadTimePorFamilia,
  LeadTimePorProducto,
  PuntoMensualLeadTime,
} from "@/lib/types/dominio";
import {
  activo,
  aFechaISO,
  ESTADOS_VENTA_VALIDOS,
  FAMILIAS_INCLUIDAS,
  familiaIncluida,
  RUBROS_HELADO,
} from "./shared";

export interface FiltrosHistorico {
  desde: string; // YYYY-MM-DD, inclusive
  hasta: string; // YYYY-MM-DD, exclusive
  familia?: string;
  producto?: string;
}

const CLAUSULA_BASE = `
  from g360.f_detalles_ventas dv
  join g360.d_productos p on p.id_prod = dv.id_prod
  left join g360.f_ventas v on v.id_venta = dv.id_venta
  where ${activo("dv")}
    and ${activo("p")}
    and coalesce(dv.nc, false) = false
    and p.rubro = any($1::text[])
    and (v.id_venta is null or (${activo("v")} and v.estado = any($2::text[])))
    and dv.fecha_venta >= $3 and dv.fecha_venta < $4
    and ($5::text is null or p.familia = $5)
    and ($6::text is null or p.id_prod = $6)
    and ${familiaIncluida("p", 7)}
`;

function parametrosBase(filtros: FiltrosHistorico) {
  return [
    RUBROS_HELADO,
    ESTADOS_VENTA_VALIDOS,
    filtros.desde,
    filtros.hasta,
    filtros.familia ?? null,
    filtros.producto ?? null,
    FAMILIAS_INCLUIDAS,
  ];
}

export async function obtenerSerieMensual(
  filtros: FiltrosHistorico
): Promise<PuntoMensualLeadTime[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `select
       to_char(date_trunc('month', dv.fecha_venta), 'YYYY-MM') as mes,
       count(*) as total_lineas,
       count(dv.lote_fabricacion) as con_fecha_fab,
       array_agg((dv.fecha_venta - dv.lote_fabricacion)::int)
         filter (where dv.lote_fabricacion is not null) as dias_lead_time
     ${CLAUSULA_BASE}
     group by mes
     order by mes`,
    parametrosBase(filtros)
  );

  return rows.map((fila) => {
    const dias: number[] = fila.dias_lead_time ?? [];
    const resumen = resumenEstadistico(dias);
    const totalLineas = Number(fila.total_lineas);
    const conFechaFab = Number(fila.con_fecha_fab);
    return {
      mes: fila.mes,
      n: resumen.n,
      promedio: resumen.promedio,
      mediana: resumen.mediana,
      p95: resumen.p95,
      coberturaPct: totalLineas > 0 ? Math.round((conFechaFab / totalLineas) * 1000) / 10 : null,
    };
  });
}

export async function obtenerDesglosePorFamilia(
  filtros: FiltrosHistorico
): Promise<LeadTimePorFamilia[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `select
       coalesce(p.familia, 'Sin familia') as familia,
       array_agg((dv.fecha_venta - dv.lote_fabricacion)::int)
         filter (where dv.lote_fabricacion is not null) as dias_lead_time
     ${CLAUSULA_BASE}
     group by familia
     order by familia`,
    parametrosBase(filtros)
  );

  return rows.map((fila) => {
    const dias: number[] = fila.dias_lead_time ?? [];
    const resumen = resumenEstadistico(dias);
    return {
      familia: fila.familia,
      n: resumen.n,
      promedio: resumen.promedio,
      mediana: resumen.mediana,
      p95: resumen.p95,
    };
  });
}

export async function obtenerDesglosePorProducto(
  filtros: FiltrosHistorico,
  limite = 50
): Promise<LeadTimePorProducto[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `select
       p.id_prod,
       max(p.detalle) as detalle,
       max(p.familia) as familia,
       max(p.leadtime_permitido) as leadtime_permitido,
       array_agg((dv.fecha_venta - dv.lote_fabricacion)::int)
         filter (where dv.lote_fabricacion is not null) as dias_lead_time
     ${CLAUSULA_BASE}
     group by p.id_prod
     order by count(*) desc
     limit $8`,
    [...parametrosBase(filtros), limite]
  );

  return rows.map((fila) => {
    const dias: number[] = fila.dias_lead_time ?? [];
    const resumen = resumenEstadistico(dias);
    const leadtimePermitido =
      fila.leadtime_permitido === null ? null : Number(fila.leadtime_permitido);
    const referencia = resumen.promedio;
    return {
      idProd: fila.id_prod,
      detalle: fila.detalle ?? fila.id_prod,
      familia: fila.familia,
      n: resumen.n,
      promedio: resumen.promedio,
      mediana: resumen.mediana,
      p95: resumen.p95,
      leadtimePermitido,
      estadoCumplimiento:
        referencia === null ? "sin_parametro" : clasificarCumplimiento(referencia, leadtimePermitido),
    };
  });
}

export async function obtenerCoberturaGlobal(filtros: FiltrosHistorico): Promise<CoberturaDatos> {
  const pool = getPool();
  const parametros = [
    RUBROS_HELADO,
    filtros.desde,
    filtros.hasta,
    FAMILIAS_INCLUIDAS,
    filtros.familia ?? null,
  ];
  const { rows } = await pool.query(
    `select
       count(*) as total_lineas,
       count(dv.lote_fabricacion) as con_fecha_fab,
       count(*) filter (where v.id_venta is null) as sin_cabecera_venta
     from g360.f_detalles_ventas dv
     join g360.d_productos p on p.id_prod = dv.id_prod
     left join g360.f_ventas v on v.id_venta = dv.id_venta
     where ${activo("dv")}
       and ${activo("p")}
       and p.rubro = any($1::text[])
       and dv.fecha_venta >= $2 and dv.fecha_venta < $3
       and ${familiaIncluida("p", 4)}
       and ($5::text is null or p.familia = $5)`,
    parametros
  );

  const { rows: ncRows } = await pool.query(
    `select count(*) as notas_credito
     from g360.f_detalles_ventas dv
     join g360.d_productos p on p.id_prod = dv.id_prod
     where ${activo("dv")}
       and ${activo("p")}
       and p.rubro = any($1::text[])
       and dv.nc is true
       and dv.fecha_venta >= $2 and dv.fecha_venta < $3
       and ${familiaIncluida("p", 4)}
       and ($5::text is null or p.familia = $5)`,
    parametros
  );

  const fila = rows[0];
  const totalLineas = Number(fila?.total_lineas ?? 0);
  const conFechaFabricacion = Number(fila?.con_fecha_fab ?? 0);

  return {
    totalLineas,
    conFechaFabricacion,
    pctCobertura: totalLineas > 0 ? Math.round((conFechaFabricacion / totalLineas) * 1000) / 10 : null,
    sinCabeceraVenta: Number(fila?.sin_cabecera_venta ?? 0),
    notasCredito: Number(ncRows[0]?.notas_credito ?? 0),
  };
}

export interface FilaExportVenta {
  idDetVenta: string;
  idVenta: string | null;
  idProd: string;
  detalle: string | null;
  familia: string | null;
  fechaVenta: string | null;
  loteFabricacion: string | null;
  diasLeadTime: number | null;
  leadtimePermitido: number | null;
  sinCabeceraVenta: boolean;
}

export async function obtenerFilasExport(
  filtros: FiltrosHistorico,
  limite = 5000,
  offset = 0
): Promise<FilaExportVenta[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `select
       dv.id_det_venta,
       dv.id_venta,
       p.id_prod,
       p.detalle,
       p.familia,
       p.leadtime_permitido,
       dv.fecha_venta,
       dv.lote_fabricacion,
       (dv.fecha_venta - dv.lote_fabricacion)::int as dias_lead_time,
       (v.id_venta is null) as sin_cabecera_venta
     ${CLAUSULA_BASE}
     order by dv.fecha_venta desc
     limit $8 offset $9`,
    [...parametrosBase(filtros), limite, offset]
  );

  return rows.map((fila) => ({
    idDetVenta: fila.id_det_venta,
    idVenta: fila.id_venta,
    idProd: fila.id_prod,
    detalle: fila.detalle,
    familia: fila.familia,
    fechaVenta: aFechaISO(fila.fecha_venta),
    loteFabricacion: aFechaISO(fila.lote_fabricacion),
    diasLeadTime: fila.dias_lead_time === null ? null : Number(fila.dias_lead_time),
    leadtimePermitido: fila.leadtime_permitido === null ? null : Number(fila.leadtime_permitido),
    sinCabeceraVenta: Boolean(fila.sin_cabecera_venta),
  }));
}
