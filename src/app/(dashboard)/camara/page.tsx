import { Suspense } from "react";
import Link from "next/link";
import { ChartCard } from "@/components/charts/ChartCard";
import { MetricCallout } from "@/components/charts/MetricCallout";
import { DataTable } from "@/components/tables/DataTable";
import { RiskBadge } from "@/components/tables/RiskBadge";
import { StatusNote } from "@/components/StatusNote";
import { FamiliaFilter } from "@/components/filters/FamiliaFilter";
import { RiesgoFilter } from "@/components/filters/RiesgoFilter";
import { obtenerPartidasCamaraPaginadas } from "@/lib/repositories/camaraRepository";
import { listarFamilias } from "@/lib/repositories/productosRepository";
import { formatearFecha, formatearNumero } from "@/lib/domain/formato";
import type { NivelRiesgo } from "@/lib/domain/riesgo";
import type { PartidaCamara } from "@/lib/types/dominio";

export const dynamic = "force-dynamic";

const POR_PAGINA = 100;
const NIVELES_VALIDOS: NivelRiesgo[] = ["ok", "riesgo", "critico", "sin_parametro"];

export default async function CamaraPage({
  searchParams,
}: {
  searchParams: Promise<{ familia?: string; riesgo?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const familia = params.familia;
  const riesgo =
    params.riesgo && NIVELES_VALIDOS.includes(params.riesgo as NivelRiesgo)
      ? (params.riesgo as NivelRiesgo)
      : undefined;
  const pagina = Math.max(1, Number(params.pagina ?? "1") || 1);

  let partidas: PartidaCamara[] = [];
  let total = 0;
  let conteoPorRiesgo = { ok: 0, riesgo: 0, critico: 0, sin_parametro: 0 };
  let error: string | null = null;
  let familias: string[] = [];

  try {
    const [resultado, listaFamilias] = await Promise.all([
      obtenerPartidasCamaraPaginadas({ familia, riesgo }, pagina, POR_PAGINA),
      listarFamilias(),
    ]);
    partidas = resultado.partidas;
    total = resultado.total;
    conteoPorRiesgo = resultado.conteoPorRiesgo;
    familias = listaFamilias;
  } catch (err) {
    console.error("Error cargando Cámara en vivo", err);
    error = "Datos operativos pendientes de conexión G360.";
  }

  const sinFuenteConfiable = partidas.filter((p) => !p.fechaFabConfiable).length;
  const mensajes: string[] = [];
  if (error) mensajes.push(error);
  if (sinFuenteConfiable > 0) {
    mensajes.push(
      `${sinFuenteConfiable} de ${partidas.length} partidas mostradas usan fecha de ingreso a depósito como estimación de antigüedad (fecha de fabricación real no disponible para esa partida).`
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const paramsExport = new URLSearchParams();
  if (familia) paramsExport.set("familia", familia);
  if (riesgo) paramsExport.set("riesgo", riesgo);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <Suspense fallback={null}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <FamiliaFilter familias={familias} />
          <RiesgoFilter />
          <Link
            href={`/api/camara/export?${paramsExport.toString()}`}
            style={{
              marginLeft: "auto",
              display: "inline-block",
              height: "36px",
              lineHeight: "36px",
              padding: "0 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent)",
              fontWeight: 700,
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            Exportar CSV
          </Link>
        </div>
      </Suspense>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <MetricCallout label="Partidas (filtro actual)" valor={String(total)} tono="navy" />
        <MetricCallout label="Críticas" valor={String(conteoPorRiesgo.critico)} tono="danger" />
        <MetricCallout label="En riesgo" valor={String(conteoPorRiesgo.riesgo)} tono="neutral" />
        <MetricCallout label="Sin parámetro definido" valor={String(conteoPorRiesgo.sin_parametro)} tono="neutral" />
      </div>

      <ChartCard titulo="Partidas en depósito 8" subtitulo={`Página ${pagina} de ${totalPaginas} · ${total} partidas`}>
        <DataTable<PartidaCamara>
          rowKey={(p) => p.idPartistock}
          rows={partidas}
          vacio="No hay partidas en cámara para estos filtros."
          columns={[
            { key: "detalle", header: "Producto", render: (p) => p.detalle },
            { key: "familia", header: "Familia", render: (p) => p.familia ?? "—" },
            { key: "lote", header: "Lote", render: (p) => (p.lote ? p.lote.slice(0, 24) : "—") },
            { key: "venc", header: "Vencimiento", render: (p) => formatearFecha(p.venc) },
            {
              key: "dias",
              header: "Días en cámara",
              align: "right",
              render: (p) => (p.diasEnCamara === null ? "—" : formatearNumero(p.diasEnCamara, 0)),
            },
            {
              key: "fuente",
              header: "Fuente fecha",
              render: (p) => (p.fechaFabConfiable ? "Producción" : "Ingreso a depósito (estimado)"),
            },
            {
              key: "permitido",
              header: "Permitido",
              align: "right",
              render: (p) => (p.leadtimePermitido === null ? "—" : `${p.leadtimePermitido} d`),
            },
            { key: "riesgo", header: "Estado", render: (p) => <RiskBadge nivel={p.nivelRiesgo} /> },
            { key: "accion", header: "Acción sugerida", render: (p) => p.accionSugerida },
          ]}
        />

        {totalPaginas > 1 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "14px", justifyContent: "flex-end" }}>
            {pagina > 1 && (
              <PaginaLink familia={familia} riesgo={riesgo} pagina={pagina - 1} etiqueta="← Anterior" />
            )}
            {pagina < totalPaginas && (
              <PaginaLink familia={familia} riesgo={riesgo} pagina={pagina + 1} etiqueta="Siguiente →" />
            )}
          </div>
        )}
      </ChartCard>

      <StatusNote mensajes={mensajes} />
    </div>
  );
}

function PaginaLink({
  familia,
  riesgo,
  pagina,
  etiqueta,
}: {
  familia?: string;
  riesgo?: string;
  pagina: number;
  etiqueta: string;
}) {
  const params = new URLSearchParams();
  if (familia) params.set("familia", familia);
  if (riesgo) params.set("riesgo", riesgo);
  params.set("pagina", String(pagina));

  return (
    <Link
      href={`/camara?${params.toString()}`}
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--color-primary)",
        textDecoration: "none",
      }}
    >
      {etiqueta}
    </Link>
  );
}
