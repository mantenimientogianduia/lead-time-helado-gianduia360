export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (fila: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (fila: T) => string;
  vacio?: string;
}

export function DataTable<T>({ columns, rows, rowKey, vacio = "Sin resultados." }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>{vacio}</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  backgroundColor: "var(--color-surface-alt)",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                  fontSize: "12px",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((fila) => (
            <tr key={rowKey(fila)} style={{ borderBottom: "1px solid var(--color-border)" }}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align ?? "left",
                    padding: "8px 10px",
                    fontVariantNumeric: col.align === "right" ? "tabular-nums" : undefined,
                  }}
                >
                  {col.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
