"use client";

export interface PillProps {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorFondo?: string;
  colorTexto?: string;
}

export function Pill({
  activo,
  onClick,
  children,
  colorFondo = "var(--color-danger)",
  colorTexto = "var(--color-on-primary)",
}: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-pill${activo ? " is-active" : ""}`}
      style={activo ? { backgroundColor: colorFondo, color: colorTexto } : undefined}
    >
      {children}
    </button>
  );
}

export function PillGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}
