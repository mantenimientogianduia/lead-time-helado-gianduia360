import { NextRequest, NextResponse } from "next/server";
import { generarCsv } from "@/lib/csv/generarCsv";
import { obtenerFilasExport, type FilaExportVenta } from "@/lib/repositories/ventasRepository";
import { formatearFecha } from "@/lib/domain/formato";

export const runtime = "nodejs";

const LIMITE_MAXIMO = 20_000;

function periodoPorDefecto(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 12, 1));
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const { desde: desdePorDefecto, hasta: hastaPorDefecto } = periodoPorDefecto();
    const desde = params.get("desde") ?? desdePorDefecto;
    const hasta = params.get("hasta") ?? hastaPorDefecto;
    const familia = params.get("familia") ?? undefined;
    const producto = params.get("producto") ?? undefined;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      return NextResponse.json(
        { error: "Los parámetros desde/hasta deben tener formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const filas = await obtenerFilasExport({ desde, hasta, familia, producto }, LIMITE_MAXIMO, 0);

    const csv = generarCsv<FilaExportVenta>(filas, [
      { encabezado: "Producto", valor: (f) => f.detalle },
      { encabezado: "Familia", valor: (f) => f.familia },
      { encabezado: "Fecha venta", valor: (f) => formatearFecha(f.fechaVenta) },
      { encabezado: "Fecha fabricación (lote_fabricacion)", valor: (f) => formatearFecha(f.loteFabricacion) },
      { encabezado: "Días lead time", valor: (f) => f.diasLeadTime },
      { encabezado: "Lead time permitido", valor: (f) => f.leadtimePermitido },
      { encabezado: "Fecha fabricación sospechosa", valor: (f) => (f.fechaFabSospechosa ? "Sí" : "No") },
      { encabezado: "Sin cabecera de venta", valor: (f) => (f.sinCabeceraVenta ? "Sí" : "No") },
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lead-time-historico-${desde}_${hasta}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error en /api/historico/export", error);
    return NextResponse.json(
      { error: "Datos operativos pendientes de conexión G360." },
      { status: 503 }
    );
  }
}
