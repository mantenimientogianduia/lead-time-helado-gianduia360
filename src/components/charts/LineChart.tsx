"use client";

import { useState } from "react";

export interface PuntoLinea {
  mes: string; // YYYY-MM
  mediana: number | null;
  promedio: number | null;
  p95: number | null;
  n: number;
}

export interface LineChartProps {
  puntos: PuntoLinea[];
}

const MESES_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function etiquetaMes(mes: string): string {
  const [anio, numMes] = mes.split("-");
  const indice = Number(numMes) - 1;
  const nombre = MESES_ES[indice] ?? mes;
  return `${nombre} '${(anio ?? "").slice(2)}`;
}

const ANCHO = 680;
const ALTO = 260;
const MARGEN = { top: 20, right: 20, bottom: 34, left: 40 };

export function LineChart({ puntos }: LineChartProps) {
  const [indiceHover, setIndiceHover] = useState<number | null>(null);

  const conValor = puntos.filter((p) => p.mediana !== null || p.p95 !== null);
  if (conValor.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Sin datos suficientes para graficar.</p>;
  }

  const todosLosValores = puntos.flatMap((p) => [p.mediana, p.p95]).filter((v): v is number => v !== null);
  const maximoBruto = Math.max(...todosLosValores, 1);
  // Redondea el techo del eje a un numero "limpio" para que las gridlines sean legibles.
  const paso = maximoBruto <= 10 ? 2 : maximoBruto <= 50 ? 10 : maximoBruto <= 200 ? 25 : 50;
  const maximo = Math.ceil((maximoBruto * 1.15) / paso) * paso;

  const anchoUtil = ANCHO - MARGEN.left - MARGEN.right;
  const altoUtil = ALTO - MARGEN.top - MARGEN.bottom;

  const x = (i: number) =>
    MARGEN.left + (puntos.length <= 1 ? anchoUtil / 2 : (i / (puntos.length - 1)) * anchoUtil);
  const y = (v: number) => MARGEN.top + altoUtil - (v / maximo) * altoUtil;

  const serie = puntos.map((p, i) => ({
    ...p,
    cx: x(i),
    cyMediana: p.mediana === null ? null : y(p.mediana),
    cyP95: p.p95 === null ? null : y(p.p95),
  }));

  const pathDe = (campo: "cyMediana" | "cyP95") =>
    serie
      .filter((p) => p[campo] !== null)
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p[campo]}`)
      .join(" ");

  const pathMediana = pathDe("cyMediana");
  const pathP95 = pathDe("cyP95");

  const puntosArea = serie.filter((p) => p.cyMediana !== null);
  const areaPath =
    puntosArea.length > 1
      ? `${pathMediana} L ${puntosArea[puntosArea.length - 1]?.cx} ${MARGEN.top + altoUtil} L ${puntosArea[0]?.cx} ${MARGEN.top + altoUtil} Z`
      : "";

  const pasosGrid = 4;
  const gridY = Array.from({ length: pasosGrid + 1 }, (_, i) => i / pasosGrid);

  const cadaCuanto = Math.max(1, Math.ceil(serie.length / 7));
  const hover = indiceHover !== null ? serie[indiceHover] : null;
  const ultimo = serie[serie.length - 1];

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        width="100%"
        height={ALTO}
        role="img"
        aria-label="Evolución mensual de mediana y percentil 95 de lead time"
        onMouseLeave={() => setIndiceHover(null)}
      >
        {gridY.map((f) => {
          const gy = MARGEN.top + altoUtil * f;
          const valor = Math.round(maximo * (1 - f));
          return (
            <g key={f}>
              <line x1={MARGEN.left} x2={ANCHO - MARGEN.right} y1={gy} y2={gy} stroke="var(--color-surface-alt)" strokeWidth={1} />
              <text x={MARGEN.left - 8} y={gy + 3} fontSize={10} fill="var(--color-text-muted)" textAnchor="end">
                {valor}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="var(--color-primary)" opacity={0.08} stroke="none" />}

        {pathP95 && (
          <path d={pathP95} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
        )}
        <path d={pathMediana} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {indiceHover !== null && serie[indiceHover] && (
          <line
            x1={serie[indiceHover].cx}
            x2={serie[indiceHover].cx}
            y1={MARGEN.top}
            y2={MARGEN.top + altoUtil}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        )}

        {serie.map((p, i) => (
          <g key={p.mes}>
            {p.cyP95 !== null && (
              <circle cx={p.cx} cy={p.cyP95} r={3.5} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={1.5} />
            )}
            {p.cyMediana !== null && (
              <circle cx={p.cx} cy={p.cyMediana} r={5} fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth={2} />
            )}
            <rect
              x={p.cx - anchoUtil / (2 * Math.max(1, serie.length - 1))}
              y={MARGEN.top}
              width={anchoUtil / Math.max(1, serie.length - 1)}
              height={altoUtil}
              fill="transparent"
              onMouseEnter={() => setIndiceHover(i)}
            />
          </g>
        ))}

        {ultimo?.cyMediana !== null && ultimo !== undefined && (
          <text x={ultimo.cx - 6} y={ultimo.cyMediana! - 10} fontSize={11} fontWeight={700} fill="var(--color-text)" textAnchor="end">
            {ultimo.mediana} d
          </text>
        )}
        {ultimo?.cyP95 !== null && ultimo !== undefined && (
          <text x={ultimo.cx - 6} y={ultimo.cyP95! + 16} fontSize={11} fontWeight={700} fill="var(--color-text)" textAnchor="end">
            {ultimo.p95} d
          </text>
        )}

        {serie.map((p, i) => (
          <text key={p.mes} x={p.cx} y={ALTO - 10} fontSize={10} fill="var(--color-text-muted)" textAnchor="middle">
            {i % cadaCuanto === 0 || i === serie.length - 1 ? etiquetaMes(p.mes) : ""}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginTop: "4px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "14px", height: "2.5px", backgroundColor: "var(--color-primary)", display: "inline-block" }} />
          Mediana
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "14px",
              height: "2px",
              backgroundImage:
                "repeating-linear-gradient(90deg, var(--color-accent) 0 4px, transparent 4px 7px)",
              display: "inline-block",
            }}
          />
          Percentil 95
        </span>
      </div>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: `${(hover.cx / ANCHO) * 100}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <div style={{ fontWeight: 700 }}>{etiquetaMes(hover.mes)}</div>
          <div>Mediana: {hover.mediana ?? "—"} días</div>
          <div>Promedio: {hover.promedio === null ? "—" : Math.round(hover.promedio * 10) / 10} días</div>
          <div>P95: {hover.p95 ?? "—"} días</div>
          <div style={{ opacity: 0.8 }}>{hover.n} ventas trazables</div>
        </div>
      )}
    </div>
  );
}
