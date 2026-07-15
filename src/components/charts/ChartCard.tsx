export interface ChartCardProps {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}

export function ChartCard({ titulo, subtitulo, children }: ChartCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-card)",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-primary)" }}>
        {titulo}
      </div>
      {subtitulo && (
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          {subtitulo}
        </div>
      )}
      <div style={{ marginTop: "14px" }}>{children}</div>
    </div>
  );
}
