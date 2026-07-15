import { NextResponse } from "next/server";
import { obtenerResumen } from "@/lib/repositories/resumenRepository";
import type { RespuestaResumen } from "@/lib/types/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { kpis, avisos } = await obtenerResumen();
    const respuesta: RespuestaResumen = { kpis, avisos };
    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("Error en /api/resumen", error);
    return NextResponse.json(
      { error: "Datos operativos pendientes de conexión G360." },
      { status: 503 }
    );
  }
}
