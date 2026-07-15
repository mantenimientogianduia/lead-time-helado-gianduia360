import { obtenerPartidasCamaraEnriquecidas } from "./camaraRepository";
import { obtenerCoberturaGlobal, obtenerSerieMensual } from "./ventasRepository";
import { contarProductosSinLeadtimePermitido } from "./productosRepository";
import type { ResumenKpis } from "@/lib/types/dominio";

function mesCerradoAnterior(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 1, 1));
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

function ultimos12Meses(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 12, 1));
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

export interface ResumenCompleto {
  kpis: ResumenKpis;
  avisos: string[];
}

export async function obtenerResumen(): Promise<ResumenCompleto> {
  const periodoMes = mesCerradoAnterior();
  const periodoCobertura = ultimos12Meses();

  const [serieMesCerrado, cobertura, partidasCamara, productosSinParametro] = await Promise.all([
    obtenerSerieMensual(periodoMes),
    obtenerCoberturaGlobal(periodoCobertura),
    obtenerPartidasCamaraEnriquecidas(),
    contarProductosSinLeadtimePermitido(),
  ]);

  const puntoMes = serieMesCerrado[0];
  const partidasEnRiesgo = partidasCamara.filter((p) => p.nivelRiesgo === "riesgo").length;
  const partidasCriticas = partidasCamara.filter((p) => p.nivelRiesgo === "critico").length;

  const kpis: ResumenKpis = {
    leadTimePromedioMes: puntoMes?.promedio ?? null,
    leadTimeMedianaMes: puntoMes?.mediana ?? null,
    coberturaFechaFabPct: cobertura.pctCobertura,
    partidasCamaraTotal: partidasCamara.length,
    partidasEnRiesgo,
    partidasCriticas,
    productosSinParametro,
  };

  const avisos: string[] = [];
  if (cobertura.pctCobertura !== null && cobertura.pctCobertura < 95) {
    avisos.push(`Cobertura de fecha de fabricación en ventas: ${cobertura.pctCobertura}%.`);
  }
  if (partidasCriticas > 0) {
    avisos.push(`${partidasCriticas} partidas en cámara superan su lead time permitido.`);
  }
  if (productosSinParametro > 0) {
    avisos.push(`${productosSinParametro} productos de helado/pintas no tienen lead time permitido definido.`);
  }

  return { kpis, avisos };
}
