import { NextRequest, NextResponse } from "next/server";
import { obtenerPartidasCamaraPaginadas } from "@/lib/repositories/camaraRepository";
import type { NivelRiesgo } from "@/lib/domain/riesgo";
import type { RespuestaCamara } from "@/lib/types/api";

export const runtime = "nodejs";

const NIVELES_VALIDOS: NivelRiesgo[] = ["ok", "riesgo", "critico", "sin_parametro"];
const POR_PAGINA_MAX = 500;
const POR_PAGINA_DEFECTO = 100;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const familia = params.get("familia") ?? undefined;
    const riesgoParam = params.get("riesgo") ?? undefined;
    const riesgo =
      riesgoParam && NIVELES_VALIDOS.includes(riesgoParam as NivelRiesgo)
        ? (riesgoParam as NivelRiesgo)
        : undefined;

    const pagina = Math.max(1, Number(params.get("pagina") ?? "1") || 1);
    const porPagina = Math.min(
      POR_PAGINA_MAX,
      Math.max(1, Number(params.get("porPagina") ?? String(POR_PAGINA_DEFECTO)) || POR_PAGINA_DEFECTO)
    );

    const { partidas, total } = await obtenerPartidasCamaraPaginadas(
      { familia, riesgo },
      pagina,
      porPagina
    );

    const avisos: string[] = [];
    const sinFuenteConfiable = partidas.filter((p) => !p.fechaFabConfiable).length;
    if (sinFuenteConfiable > 0) {
      avisos.push(
        `${sinFuenteConfiable} de ${partidas.length} partidas mostradas usan fecha de ingreso a depósito como estimación (fecha de fabricación real no disponible).`
      );
    }

    const respuesta: RespuestaCamara = { partidas, total, pagina, porPagina, avisos };
    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error en /api/camara", error);
    return NextResponse.json(
      { error: "Datos operativos pendientes de conexión G360." },
      { status: 503 }
    );
  }
}
