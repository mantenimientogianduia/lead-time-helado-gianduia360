"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pill, PillGroup } from "./Pill";

const OPCIONES = [
  { meses: 3, etiqueta: "3 meses" },
  { meses: 6, etiqueta: "6 meses" },
  { meses: 12, etiqueta: "12 meses" },
  { meses: 24, etiqueta: "24 meses" },
];

function calcularRango(meses: number): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - meses, 1));
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

export function PeriodoFilter({ mesesActual }: { mesesActual: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(meses: number) {
    const { desde, hasta } = calcularRango(meses);
    const params = new URLSearchParams(searchParams.toString());
    params.set("desde", desde);
    params.set("hasta", hasta);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <PillGroup label="Período">
      {OPCIONES.map((o) => (
        <Pill key={o.meses} activo={mesesActual === o.meses} onClick={() => onChange(o.meses)}>
          {o.etiqueta}
        </Pill>
      ))}
    </PillGroup>
  );
}
