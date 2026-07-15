export type TonoMetrica = "navy" | "success" | "danger" | "neutral";

const COLOR_POR_TONO: Record<TonoMetrica, string> = {
  navy: "var(--color-primary)",
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  neutral: "var(--color-text-muted)",
};

export interface MetricCalloutProps {
  label: string;
  valor: string;
  aclaracion?: string;
  tono?: TonoMetrica;
}

export function MetricCallout({ label, valor, aclaracion, tono = "navy" }: MetricCalloutProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: COLOR_POR_TONO[tono],
          lineHeight: 1.1,
          marginTop: "6px",
        }}
      >
        {valor}
      </div>
      {aclaracion && (
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>
          {aclaracion}
        </div>
      )}
    </div>
  );
}
