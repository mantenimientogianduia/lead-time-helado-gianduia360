"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pill, PillGroup } from "./Pill";

const OPCIONES = [
  { valor: "", etiqueta: "Todos", colorFondo: "var(--color-danger)", colorTexto: "var(--color-on-primary)" },
  { valor: "critico", etiqueta: "Crítico", colorFondo: "var(--color-danger)", colorTexto: "var(--color-on-primary)" },
  { valor: "riesgo", etiqueta: "En riesgo", colorFondo: "var(--color-accent)", colorTexto: "var(--color-on-accent)" },
  { valor: "ok", etiqueta: "Ok", colorFondo: "var(--color-success)", colorTexto: "var(--color-on-primary)" },
  { valor: "sin_parametro", etiqueta: "Sin parámetro", colorFondo: "var(--color-text-muted)", colorTexto: "var(--color-on-primary)" },
];

export function RiesgoFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const valorActual = searchParams.get("riesgo") ?? "";

  function onChange(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set("riesgo", valor);
    else params.delete("riesgo");
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <PillGroup label="Nivel de riesgo">
      {OPCIONES.map((o) => (
        <Pill
          key={o.valor}
          activo={valorActual === o.valor}
          onClick={() => onChange(o.valor)}
          colorFondo={o.colorFondo}
          colorTexto={o.colorTexto}
        >
          {o.etiqueta}
        </Pill>
      ))}
    </PillGroup>
  );
}
