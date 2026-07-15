import { describe, expect, it } from "vitest";
import { ajustarAccionPorReproceso, clasificarRiesgo } from "@/lib/domain/riesgo";

describe("clasificarRiesgo", () => {
  it("marca sin_parametro cuando leadtimePermitido es null", () => {
    const r = clasificarRiesgo(10, null);
    expect(r.nivel).toBe("sin_parametro");
    expect(r.pctConsumido).toBeNull();
  });

  it("marca sin_parametro cuando leadtimePermitido es undefined", () => {
    expect(clasificarRiesgo(10, undefined).nivel).toBe("sin_parametro");
  });

  it("marca sin_parametro cuando leadtimePermitido es 0 (no es umbral de 0 días)", () => {
    expect(clasificarRiesgo(0, 0).nivel).toBe("sin_parametro");
  });

  it("marca sin_parametro cuando leadtimePermitido es negativo", () => {
    expect(clasificarRiesgo(5, -3).nivel).toBe("sin_parametro");
  });

  it("clasifica ok por debajo del umbral de riesgo", () => {
    const r = clasificarRiesgo(5, 10); // 50%
    expect(r.nivel).toBe("ok");
    expect(r.pctConsumido).toBe(50);
  });

  it("clasifica riesgo en el borde inferior (70%)", () => {
    const r = clasificarRiesgo(7, 10); // 70%
    expect(r.nivel).toBe("riesgo");
  });

  it("clasifica riesgo justo antes de superar el permitido", () => {
    const r = clasificarRiesgo(10, 10); // 100%
    expect(r.nivel).toBe("riesgo");
  });

  it("clasifica critico al superar el permitido", () => {
    const r = clasificarRiesgo(11, 10); // 110%
    expect(r.nivel).toBe("critico");
  });

  it("cada nivel trae una accion sugerida no vacía", () => {
    for (const dias of [0, 5, 7, 10, 15]) {
      const r = clasificarRiesgo(dias, 10);
      expect(r.accionSugerida.length).toBeGreaterThan(0);
    }
  });
});

describe("ajustarAccionPorReproceso", () => {
  it("no marca candidato si el producto no es reprocesable", () => {
    const evaluacion = clasificarRiesgo(11, 10); // critico
    const r = ajustarAccionPorReproceso(evaluacion, false);
    expect(r.esCandidatoReproceso).toBe(false);
    expect(r.accionSugerida).toBe(evaluacion.accionSugerida);
  });

  it("no marca candidato si reprocesable es null/undefined", () => {
    const evaluacion = clasificarRiesgo(11, 10);
    expect(ajustarAccionPorReproceso(evaluacion, null).esCandidatoReproceso).toBe(false);
    expect(ajustarAccionPorReproceso(evaluacion, undefined).esCandidatoReproceso).toBe(false);
  });

  it("no marca candidato si el nivel es ok, aunque sea reprocesable", () => {
    const evaluacion = clasificarRiesgo(2, 10); // ok
    const r = ajustarAccionPorReproceso(evaluacion, true);
    expect(r.esCandidatoReproceso).toBe(false);
  });

  it("no marca candidato si el nivel es sin_parametro, aunque sea reprocesable", () => {
    const evaluacion = clasificarRiesgo(20, null);
    const r = ajustarAccionPorReproceso(evaluacion, true);
    expect(r.esCandidatoReproceso).toBe(false);
  });

  it("marca candidato y sugiere reprocesar cuando esta en riesgo y es reprocesable", () => {
    const evaluacion = clasificarRiesgo(7, 10); // riesgo (70%)
    const r = ajustarAccionPorReproceso(evaluacion, true);
    expect(r.esCandidatoReproceso).toBe(true);
    expect(r.accionSugerida).toMatch(/reprocesar/i);
  });

  it("marca candidato y sugiere reprocesar cuando esta critico y es reprocesable", () => {
    const evaluacion = clasificarRiesgo(15, 10); // critico
    const r = ajustarAccionPorReproceso(evaluacion, true);
    expect(r.esCandidatoReproceso).toBe(true);
    expect(r.accionSugerida).toMatch(/reprocesar/i);
  });
});
