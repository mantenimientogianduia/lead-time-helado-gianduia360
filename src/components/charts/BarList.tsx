export interface BarListItem {
  etiqueta: string;
  valor: number | null;
  detalle?: string;
}

export interface BarListProps {
  items: BarListItem[];
  formatearValor?: (valor: number) => string;
}

export function BarList({ items, formatearValor = (v) => String(Math.round(v * 10) / 10) }: BarListProps) {
  const maximo = Math.max(1, ...items.map((i) => i.valor ?? 0));

  if (items.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Sin datos para este período.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((item) => {
        const pct = item.valor === null ? 0 : Math.max(2, (item.valor / maximo) * 100);
        return (
          <div key={item.etiqueta}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "var(--color-text)",
                marginBottom: "3px",
              }}
            >
              <span style={{ fontWeight: 700 }}>{item.etiqueta}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {item.valor === null ? "—" : formatearValor(item.valor)}
                {item.detalle ? ` · ${item.detalle}` : ""}
              </span>
            </div>
            <div
              style={{
                height: "16px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-surface-alt)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  backgroundColor: "var(--color-accent)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
