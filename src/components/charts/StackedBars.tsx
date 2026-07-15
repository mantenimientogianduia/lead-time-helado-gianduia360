export interface SegmentoStacked {
  clave: string;
  etiqueta: string;
  valor: number;
  color: string;
}

export interface StackedBarsProps {
  segmentos: SegmentoStacked[];
}

/** Barra apilada horizontal única (ej. partidas de cámara por nivel de riesgo). */
export function StackedBars({ segmentos }: StackedBarsProps) {
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0);

  if (total === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Sin partidas para mostrar.</p>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: "24px",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          gap: "2px",
        }}
      >
        {segmentos
          .filter((s) => s.valor > 0)
          .map((s) => (
            <div
              key={s.clave}
              title={`${s.etiqueta}: ${s.valor}`}
              style={{
                width: `${(s.valor / total) * 100}%`,
                backgroundColor: s.color,
                minWidth: "2px",
              }}
            />
          ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "10px" }}>
        {segmentos.map((s) => (
          <div key={s.clave} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "2px",
                backgroundColor: s.color,
              }}
            />
            <span style={{ color: "var(--color-text)" }}>
              {s.etiqueta} <strong style={{ fontVariantNumeric: "tabular-nums" }}>{s.valor}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
