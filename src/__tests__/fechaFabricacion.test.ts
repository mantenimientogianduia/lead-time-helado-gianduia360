import { describe, expect, it } from "vitest";
import { resolverFechaFabricacion } from "@/lib/domain/fechaFabricacion";

describe("resolverFechaFabricacion", () => {
  it("prioriza el match por lote+id_prod contra produccion", () => {
    const r = resolverFechaFabricacion({
      fechaFabProduccionPorLote: "2026-01-05",
      tsIngreso: "2026-01-10",
    });
    expect(r).toEqual({ fecha: "2026-01-05", fuente: "produccion_lote_id_prod", confiable: true });
  });

  it("cae a ts_ingreso si no hay match de produccion", () => {
    const r = resolverFechaFabricacion({
      fechaFabProduccionPorLote: null,
      tsIngreso: "2026-01-10",
    });
    expect(r).toEqual({ fecha: "2026-01-10", fuente: "ts_ingreso", confiable: false });
  });

  it("devuelve sin_dato cuando no hay ningun candidato", () => {
    const r = resolverFechaFabricacion({
      fechaFabProduccionPorLote: null,
      tsIngreso: null,
    });
    expect(r).toEqual({ fecha: null, fuente: "sin_dato", confiable: false });
  });
});
