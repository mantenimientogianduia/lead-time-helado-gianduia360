import type { NivelRiesgo } from "@/lib/domain/riesgo";

const CONFIG: Record<NivelRiesgo, { etiqueta: string; color: string; fondo: string }> = {
  ok: { etiqueta: "Ok", color: "var(--color-success)", fondo: "rgba(30, 107, 58, 0.1)" },
  riesgo: { etiqueta: "En riesgo", color: "var(--color-accent)", fondo: "rgba(200, 151, 58, 0.16)" },
  critico: { etiqueta: "Crítico", color: "var(--color-danger)", fondo: "rgba(139, 26, 43, 0.1)" },
  sin_parametro: { etiqueta: "Sin parámetro", color: "var(--color-text-muted)", fondo: "var(--color-surface-alt)" },
};

/** Color de acento por nivel de riesgo, reutilizable en otras celdas (ej. "Días en cámara"). */
export const COLOR_RIESGO: Record<NivelRiesgo, string> = {
  ok: CONFIG.ok.color,
  riesgo: CONFIG.riesgo.color,
  critico: CONFIG.critico.color,
  sin_parametro: CONFIG.sin_parametro.color,
};

export function RiskBadge({ nivel }: { nivel: NivelRiesgo }) {
  const { etiqueta, color, fondo } = CONFIG[nivel];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: fondo,
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--color-text)",
      }}
    >
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
      {etiqueta}
    </span>
  );
}
