import { getPool } from "@/lib/db/pool";
import { resolverFechaFabricacion } from "@/lib/domain/fechaFabricacion";
import { clasificarRiesgo } from "@/lib/domain/riesgo";
import type { PartidaCamara } from "@/lib/types/dominio";
import {
  activo,
  aFechaISO,
  DEPOSITO_CAMARA,
  FAMILIAS_INCLUIDAS,
  familiaIncluida,
  RUBROS_HELADO,
} from "./shared";

/**
 * Tope duro de partidas leídas por consulta. El depósito 8 (helado/pintas) ronda ~1.500-2.000
 * partidas activas hoy; este límite es una salvaguarda, no el tamaño esperado habitual.
 */
const LIMITE_DURO_LECTURA = 5000;

interface FilaCruda {
  id_partistock: string;
  id_prod: string;
  detalle: string | null;
  familia: string | null;
  leadtime_permitido: string | number | null;
  lote: string | null;
  venc: string | null;
  presentacion: string | number | null;
  origen: string | null;
  ts_ingreso: string | null;
  fecha_fab_produccion: string | null;
}

async function consultarPartidasCrudas(familia?: string): Promise<FilaCruda[]> {
  const pool = getPool();
  const { rows } = await pool.query<FilaCruda>(
    `select
       ps.id_partistock,
       ps.id_prod,
       p.detalle,
       p.familia,
       p.leadtime_permitido,
       ps.lote,
       ps.venc,
       ps.presentacion,
       ps.origen,
       ps.ts_ingreso,
       po.fecha_fab as fecha_fab_produccion
     from g360.f_partidas_stock ps
     join g360.d_productos p on p.id_prod = ps.id_prod
     left join lateral (
       select op.fecha_fab
       from g360.f_partidas_op op
       where op.id_prod = ps.id_prod
         and op.lote = ps.lote
         and ${activo("op")}
         and op.fecha_fab is not null
       order by op.fecha_fab desc, op.id_parti_op desc
       limit 1
     ) po on true
     where ${activo("ps")}
       and ${activo("p")}
       and ps.id_dep = $1
       and p.rubro = any($2::text[])
       and ($3::text is null or p.familia = $3)
       and ${familiaIncluida("p", 5)}
     order by ps.ts_ingreso asc nulls last
     limit $4`,
    [DEPOSITO_CAMARA, RUBROS_HELADO, familia ?? null, LIMITE_DURO_LECTURA, FAMILIAS_INCLUIDAS]
  );
  return rows.map((fila) => ({
    ...fila,
    venc: aFechaISO(fila.venc),
    ts_ingreso: aFechaISO(fila.ts_ingreso),
    fecha_fab_produccion: aFechaISO(fila.fecha_fab_produccion),
  }));
}

function enriquecer(fila: FilaCruda, ahora: Date): PartidaCamara {
  const resolucion = resolverFechaFabricacion({
    fechaFabProduccionPorLote: fila.fecha_fab_produccion,
    tsIngreso: fila.ts_ingreso,
  });

  let diasEnCamara: number | null = null;
  if (resolucion.fecha) {
    const fecha = new Date(resolucion.fecha);
    if (!Number.isNaN(fecha.getTime())) {
      diasEnCamara = Math.max(0, Math.floor((ahora.getTime() - fecha.getTime()) / 86_400_000));
    }
  }

  const leadtimePermitido =
    fila.leadtime_permitido === null || fila.leadtime_permitido === undefined
      ? null
      : Number(fila.leadtime_permitido);

  const evaluacion =
    diasEnCamara === null
      ? { nivel: "sin_parametro" as const, pctConsumido: null, accionSugerida: "Dato de antigüedad no disponible para esta partida." }
      : clasificarRiesgo(diasEnCamara, leadtimePermitido);

  return {
    idPartistock: fila.id_partistock,
    idProd: fila.id_prod,
    detalle: fila.detalle ?? fila.id_prod,
    familia: fila.familia,
    lote: fila.lote,
    venc: fila.venc,
    presentacion: fila.presentacion === null ? null : Number(fila.presentacion),
    origen: fila.origen,
    fechaFabricacion: resolucion.fecha,
    diasEnCamara,
    fuenteFecha: resolucion.fuente,
    fechaFabConfiable: resolucion.confiable,
    leadtimePermitido,
    nivelRiesgo: evaluacion.nivel,
    pctConsumido: evaluacion.pctConsumido,
    accionSugerida: evaluacion.accionSugerida,
  };
}

export interface FiltrosCamara {
  familia?: string;
  riesgo?: PartidaCamara["nivelRiesgo"];
}

export interface ConteoPorRiesgo {
  ok: number;
  riesgo: number;
  critico: number;
  sin_parametro: number;
}

export interface ResultadoCamara {
  partidas: PartidaCamara[];
  total: number;
  /** Conteo por nivel de riesgo sobre el total filtrado (no solo la página mostrada). */
  conteoPorRiesgo: ConteoPorRiesgo;
}

function contarPorRiesgo(partidas: PartidaCamara[]): ConteoPorRiesgo {
  const conteo: ConteoPorRiesgo = { ok: 0, riesgo: 0, critico: 0, sin_parametro: 0 };
  for (const p of partidas) conteo[p.nivelRiesgo] += 1;
  return conteo;
}

/** Trae, resuelve y clasifica todas las partidas de cámara que matchean los filtros (sin paginar). */
export async function obtenerPartidasCamaraEnriquecidas(
  filtros: FiltrosCamara = {}
): Promise<PartidaCamara[]> {
  const crudas = await consultarPartidasCrudas(filtros.familia);
  const ahora = new Date();
  const enriquecidas = crudas.map((fila) => enriquecer(fila, ahora));

  if (!filtros.riesgo) return enriquecidas;
  return enriquecidas.filter((p) => p.nivelRiesgo === filtros.riesgo);
}

export async function obtenerPartidasCamaraPaginadas(
  filtros: FiltrosCamara,
  pagina: number,
  porPagina: number
): Promise<ResultadoCamara> {
  const todas = await obtenerPartidasCamaraEnriquecidas(filtros);
  const inicio = (pagina - 1) * porPagina;
  return {
    partidas: todas.slice(inicio, inicio + porPagina),
    total: todas.length,
    conteoPorRiesgo: contarPorRiesgo(todas),
  };
}
