export interface ItemPromedioP95 {
  etiqueta: string;
  promedio: number | null;
  p95: number | null;
  detalle?: string;
}

export interface PromedioP95BarListProps {
  items: ItemPromedioP95[];
}

export function PromedioP95BarList({ items }: PromedioP95BarListProps) {
  if (items.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Sin datos para este período.</p>;
  }

  const maximo = Math.max(1, ...items.flatMap((i) => [i.promedio ?? 0, i.p95 ?? 0]));

  return (
    <div>
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginBottom: "12px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-primary)", display: "inline-block" }} />
          Promedio
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-accent)", display: "inline-block" }} />
          Percentil 95
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {items.map((item) => (
          <div key={item.etiqueta}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text)", marginBottom: "4px" }}>
              {item.etiqueta}
              {item.detalle && (
                <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}> · {item.detalle}</span>
              )}
            </div>
            <BarraMetrica valor={item.promedio} maximo={maximo} color="var(--color-primary)" />
            <div style={{ height: "3px" }} />
            <BarraMetrica valor={item.p95} maximo={maximo} color="var(--color-accent)" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BarraMetrica({ valor, maximo, color }: { valor: number | null; maximo: number; color: string }) {
  const pct = valor === null ? 0 : Math.max(1.5, (valor / maximo) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "10px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-surface-alt)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "var(--radius-sm)" }} />
      </div>
      <span style={{ width: "48px", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
        {valor === null ? "—" : `${Math.round(valor * 10) / 10} d`}
      </span>
    </div>
  );
}
