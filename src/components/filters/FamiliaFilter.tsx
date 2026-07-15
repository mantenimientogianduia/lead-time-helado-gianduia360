"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pill, PillGroup } from "./Pill";

export function FamiliaFilter({ familias }: { familias: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const valorActual = searchParams.get("familia") ?? "";

  function onChange(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set("familia", valor);
    else params.delete("familia");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <PillGroup label="Familia">
      <Pill activo={valorActual === ""} onClick={() => onChange("")}>
        Todas
      </Pill>
      {familias.map((f) => (
        <Pill key={f} activo={valorActual === f} onClick={() => onChange(f)}>
          {f}
        </Pill>
      ))}
    </PillGroup>
  );
}
