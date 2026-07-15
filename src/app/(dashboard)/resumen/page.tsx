import { Suspense } from "react";
import { MetricCallout } from "@/components/charts/MetricCallout";
import { ChartCard } from "@/components/charts/ChartCard";
import { LineChart } from "@/components/charts/LineChart";
import { BarList } from "@/components/charts/BarList";
import { PromedioP95BarList } from "@/components/charts/PromedioP95BarList";
import { StackedBars } from "@/components/charts/StackedBars";
import { StatusNote } from "@/components/StatusNote";
import { PeriodoFilter } from "@/components/filters/PeriodoFilter";
import { FamiliaFilter } from "@/components/filters/FamiliaFilter";
import {
  obtenerCoberturaGlobal,
  obtenerDesglosePorFamilia,
  obtenerDesglosePorProducto,
  obtenerSerieMensual,
} from "@/lib/repositories/ventasRepository";
import { obtenerPartidasCamaraEnriquecidas } from "@/lib/repositories/camaraRepository";
import { listarFamilias } from "@/lib/repositories/productosRepository";
import { formatearNumero } from "@/lib/domain/formato";

export const dynamic = "force-dynamic";

/** Productos con menos ventas trazables que esto no entran en los rankings por producto (ruido). */
const VOLUMEN_MINIMO_PRODUCTO = 3;
const TOP_PRODUCTOS = 12;

function periodoPorDefecto(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 12, 1));
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

function mesesEntre(desde: string, hasta: string): number {
  const partesDesde = desde.split("-").map(Number);
  const partesHasta = hasta.split("-").map(Number);
  const ay = partesDesde[0] ?? 0;
  const am = partesDesde[1] ?? 0;
  const by = partesHasta[0] ?? 0;
  const bm = partesHasta[1] ?? 0;
  return (by - ay) * 12 + (bm - am);
}

interface ConteoRiesgo {
  ok: number;
  riesgo: number;
  critico: number;
  sin_parametro: number;
}

interface DatosResumen {
  serieMensual: Awaited<ReturnType<typeof obtenerSerieMensual>>;
  porFamilia: Awaited<ReturnType<typeof obtenerDesglosePorFamilia>>;
  porProducto: Awaited<ReturnType<typeof obtenerDesglosePorProducto>>;
  cobertura: Awaited<ReturnType<typeof obtenerCoberturaGlobal>>;
  familias: string[];
  partidasPorRiesgo: ConteoRiesgo;
  error: string | null;
}

async function cargarDatos(desde: string, hasta: string, familia?: string): Promise<DatosResumen> {
  try {
    const filtros = { desde, hasta, familia };
    const [serieMensual, porFamilia, porProducto, cobertura, partidas, familias] = await Promise.all([
      obtenerSerieMensual(filtros),
      obtenerDesglosePorFamilia(filtros),
      obtenerDesglosePorProducto(filtros, 200),
      obtenerCoberturaGlobal(filtros),
      obtenerPartidasCamaraEnriquecidas({ familia }),
      listarFamilias(),
    ]);

    const partidasPorRiesgo: ConteoRiesgo = { ok: 0, riesgo: 0, critico: 0, sin_parametro: 0 };
    for (const p of partidas) partidasPorRiesgo[p.nivelRiesgo] += 1;

    return { serieMensual, porFamilia, porProducto, cobertura, familias, partidasPorRiesgo, error: null };
  } catch (error) {
    console.error("Error cargando datos de Resumen", error);
    return {
      serieMensual: [],
      porFamilia: [],
      porProducto: [],
      cobertura: { totalLineas: 0, conFechaFabricacion: 0, pctCobertura: null, sinCabeceraVenta: 0, notasCredito: 0 },
      familias: [],
      partidasPorRiesgo: { ok: 0, riesgo: 0, critico: 0, sin_parametro: 0 },
      error: "Datos operativos pendientes de conexión G360.",
    };
  }
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; familia?: string }>;
}) {
  const params = await searchParams;
  const porDefecto = periodoPorDefecto();
  const desde = params.desde ?? porDefecto.desde;
  const hasta = params.hasta ?? porDefecto.hasta;
  const familia = params.familia;

  const { serieMensual, porFamilia, porProducto, cobertura, familias, partidasPorRiesgo, error } =
    await cargarDatos(desde, hasta, familia);

  const ultimoPunto = serieMensual[serieMensual.length - 1] ?? null;
  const mensajes: string[] = [];
  if (error) mensajes.push(error);
  if (cobertura.pctCobertura !== null && cobertura.pctCobertura < 95) {
    mensajes.push(`Cobertura de fecha de fabricación en ventas del período: ${cobertura.pctCobertura}%.`);
  }
  if (cobertura.sinCabeceraVenta > 0) {
    mensajes.push(`${cobertura.sinCabeceraVenta} ventas del período sin cabecera asociada (dato histórico incompleto).`);
  }

  const productosRankeados = porProducto
    .filter((p) => p.n >= VOLUMEN_MINIMO_PRODUCTO && p.promedio !== null)
    .sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0))
    .slice(0, TOP_PRODUCTOS);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <Suspense fallback={null}>
        <div style={{ display: "flex", gap: "16px" }}>
          <PeriodoFilter mesesActual={mesesEntre(desde, hasta)} />
          <FamiliaFilter familias={familias} />
        </div>
      </Suspense>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <MetricCallout
          label="Lead time — mediana (último mes)"
          valor={ultimoPunto?.mediana !== null && ultimoPunto ? `${formatearNumero(ultimoPunto.mediana)} días` : "—"}
          tono="navy"
        />
        <MetricCallout
          label="Lead time — P95 (último mes)"
          valor={ultimoPunto?.p95 !== null && ultimoPunto ? `${formatearNumero(ultimoPunto.p95)} días` : "—"}
          aclaracion="Cola de riesgo: 95% de las ventas trazables están por debajo de este valor"
          tono="neutral"
        />
        <MetricCallout
          label="Cobertura de datos"
          valor={cobertura.pctCobertura !== null ? `${formatearNumero(cobertura.pctCobertura)}%` : "—"}
          aclaracion="Ventas con fecha de fabricación registrada"
          tono={cobertura.pctCobertura !== null && cobertura.pctCobertura < 95 ? "danger" : "success"}
        />
        <MetricCallout
          label="Partidas en cámara — riesgo/crítico"
          valor={`${partidasPorRiesgo.riesgo + partidasPorRiesgo.critico}`}
          aclaracion={`de ${partidasPorRiesgo.ok + partidasPorRiesgo.riesgo + partidasPorRiesgo.critico + partidasPorRiesgo.sin_parametro} partidas en depósito 8`}
          tono={partidasPorRiesgo.critico > 0 ? "danger" : "navy"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
        <ChartCard titulo="Evolución mensual del lead time" subtitulo="Mediana y percentil 95, días entre fabricación y venta">
          <LineChart puntos={serieMensual} />
        </ChartCard>
        <ChartCard titulo="Partidas en cámara por nivel de riesgo" subtitulo="Depósito 8, hoy">
          <StackedBars
            segmentos={[
              { clave: "ok", etiqueta: "Ok", valor: partidasPorRiesgo.ok, color: "var(--color-success)" },
              { clave: "riesgo", etiqueta: "En riesgo", valor: partidasPorRiesgo.riesgo, color: "var(--color-accent)" },
              { clave: "critico", etiqueta: "Crítico", valor: partidasPorRiesgo.critico, color: "var(--color-danger)" },
              { clave: "sin_parametro", etiqueta: "Sin parámetro", valor: partidasPorRiesgo.sin_parametro, color: "var(--color-text-muted)" },
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard titulo="Lead time por familia" subtitulo="Mediana de días, período seleccionado">
        <BarList
          items={porFamilia
            .filter((f) => f.n > 0)
            .sort((a, b) => (b.mediana ?? 0) - (a.mediana ?? 0))
            .map((f) => ({ etiqueta: f.familia, valor: f.mediana, detalle: `${f.n} ventas` }))}
          formatearValor={(v) => `${formatearNumero(v)} días`}
        />
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <ChartCard
          titulo="Lead time promedio por producto"
          subtitulo={`Top ${TOP_PRODUCTOS} con más días, mínimo ${VOLUMEN_MINIMO_PRODUCTO} ventas trazables`}
        >
          <BarList
            items={productosRankeados.map((p) => ({
              etiqueta: p.detalle,
              valor: p.promedio,
              detalle: `${p.n} ventas`,
            }))}
            formatearValor={(v) => `${formatearNumero(v)} días`}
          />
        </ChartCard>
        <ChartCard
          titulo="Promedio vs. percentil 95 por producto"
          subtitulo="Mismo ranking: compara el típico contra la cola de riesgo"
        >
          <PromedioP95BarList
            items={productosRankeados.map((p) => ({
              etiqueta: p.detalle,
              promedio: p.promedio,
              p95: p.p95,
              detalle: `${p.n} ventas`,
            }))}
          />
        </ChartCard>
      </div>

      <StatusNote mensajes={mensajes} />
    </div>
  );
}
