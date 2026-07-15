import { NextRequest, NextResponse } from "next/server";
import {
  obtenerCoberturaGlobal,
  obtenerDesglosePorFamilia,
  obtenerDesglosePorProducto,
  obtenerSerieMensual,
  type FiltrosHistorico,
} from "@/lib/repositories/ventasRepository";
import type { RespuestaHistorico } from "@/lib/types/api";

export const runtime = "nodejs";

function periodoPorDefecto(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 12, 1));
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

function parsearFiltros(searchParams: URLSearchParams): FiltrosHistorico {
  const { desde: desdePorDefecto, hasta: hastaPorDefecto } = periodoPorDefecto();
  const desde = searchParams.get("desde") ?? desdePorDefecto;
  const hasta = searchParams.get("hasta") ?? hastaPorDefecto;
  const familia = searchParams.get("familia") ?? undefined;
  const producto = searchParams.get("producto") ?? undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    throw new Error("Los parámetros desde/hasta deben tener formato YYYY-MM-DD.");
  }

  return { desde, hasta, familia, producto };
}

export async function GET(request: NextRequest) {
  try {
    const filtros = parsearFiltros(request.nextUrl.searchParams);

    const [serieMensual, porFamilia, porProducto, cobertura] = await Promise.all([
      obtenerSerieMensual(filtros),
      obtenerDesglosePorFamilia(filtros),
      obtenerDesglosePorProducto(filtros),
      obtenerCoberturaGlobal(filtros),
    ]);

    const avisos: string[] = [];
    if (cobertura.pctCobertura !== null && cobertura.pctCobertura < 95) {
      avisos.push(
        `Cobertura de fecha de fabricación en ventas: ${cobertura.pctCobertura}%. Parte del período queda fuera del cálculo.`
      );
    }
    if (cobertura.sinCabeceraVenta > 0) {
      avisos.push(
        `${cobertura.sinCabeceraVenta} líneas de venta sin cabecera asociada en el período (dato histórico incompleto, igual se incluyen en el lead time).`
      );
    }
    if (cobertura.fechaFabSospechosa > 0) {
      avisos.push(
        `${cobertura.fechaFabSospechosa} líneas con fecha de fabricación inválida (ej. 01/01/1970) excluidas del cálculo de lead time.`
      );
    }

    const respuesta: RespuestaHistorico = { serieMensual, porFamilia, porProducto, cobertura, avisos };
    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error en /api/historico", error);
    return NextResponse.json(
      { error: "Datos operativos pendientes de conexión G360." },
      { status: 503 }
    );
  }
}
