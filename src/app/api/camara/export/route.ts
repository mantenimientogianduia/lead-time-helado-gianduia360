import { NextRequest, NextResponse } from "next/server";
import { generarCsv } from "@/lib/csv/generarCsv";
import { obtenerPartidasCamaraEnriquecidas } from "@/lib/repositories/camaraRepository";
import { formatearFecha } from "@/lib/domain/formato";
import type { NivelRiesgo } from "@/lib/domain/riesgo";
import type { PartidaCamara } from "@/lib/types/dominio";

export const runtime = "nodejs";

const NIVELES_VALIDOS: NivelRiesgo[] = ["ok", "riesgo", "critico", "sin_parametro"];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const familia = params.get("familia") ?? undefined;
    const riesgoParam = params.get("riesgo") ?? undefined;
    const riesgo =
      riesgoParam && NIVELES_VALIDOS.includes(riesgoParam as NivelRiesgo)
        ? (riesgoParam as NivelRiesgo)
        : undefined;

    const partidas = await obtenerPartidasCamaraEnriquecidas({ familia, riesgo });

    const csv = generarCsv<PartidaCamara>(partidas, [
      { encabezado: "Producto", valor: (p) => p.detalle },
      { encabezado: "Familia", valor: (p) => p.familia },
      { encabezado: "Días en cámara", valor: (p) => p.diasEnCamara },
      { encabezado: "Lote fab.", valor: (p) => formatearFecha(p.fechaFabricacion) },
      { encabezado: "Reprocesable", valor: (p) => (p.reprocesable === null ? null : p.reprocesable ? "Sí" : "No") },
      { encabezado: "Candidato a reproceso", valor: (p) => (p.esCandidatoReproceso ? "Sí" : "No") },
      { encabezado: "Lote", valor: (p) => p.lote },
      { encabezado: "Vencimiento", valor: (p) => formatearFecha(p.venc) },
      { encabezado: "Fuente fecha", valor: (p) => p.fuenteFecha },
      { encabezado: "Lead time permitido", valor: (p) => p.leadtimePermitido },
      { encabezado: "% consumido", valor: (p) => (p.pctConsumido === null ? null : Math.round(p.pctConsumido)) },
      { encabezado: "Nivel de riesgo", valor: (p) => p.nivelRiesgo },
      { encabezado: "Acción sugerida", valor: (p) => p.accionSugerida },
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lead-time-camara-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error en /api/camara/export", error);
    return NextResponse.json(
      { error: "Datos operativos pendientes de conexión G360." },
      { status: 503 }
    );
  }
}
