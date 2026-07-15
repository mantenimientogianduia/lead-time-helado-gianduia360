import { describe, expect, it } from "vitest";
import { mediana, percentil, promedio, resumenEstadistico } from "@/lib/domain/estadisticas";

describe("promedio", () => {
  it("devuelve null para array vacío", () => {
    expect(promedio([])).toBeNull();
  });

  it("calcula el promedio simple", () => {
    expect(promedio([1, 2, 3])).toBe(2);
  });
});

describe("mediana", () => {
  it("devuelve null para array vacío", () => {
    expect(mediana([])).toBeNull();
  });

  it("calcula la mediana con cantidad impar de elementos", () => {
    expect(mediana([5, 1, 3])).toBe(3);
  });

  it("calcula la mediana con cantidad par de elementos (interpolación)", () => {
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
  });

  it("funciona con un solo elemento", () => {
    expect(mediana([7])).toBe(7);
  });
});

describe("percentil", () => {
  it("lanza error para percentiles fuera de rango", () => {
    expect(() => percentil([1, 2, 3], -1)).toThrow();
    expect(() => percentil([1, 2, 3], 101)).toThrow();
  });

  it("devuelve null para array vacío", () => {
    expect(percentil([], 90)).toBeNull();
  });

  it("calcula p90 sobre una serie conocida", () => {
    const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentil(valores, 90)).toBeCloseTo(9.1, 5);
  });

  it("p0 es el mínimo y p100 es el máximo", () => {
    const valores = [4, 1, 7, 3];
    expect(percentil(valores, 0)).toBe(1);
    expect(percentil(valores, 100)).toBe(7);
  });
});

describe("resumenEstadistico", () => {
  it("devuelve n=0 y todo null para array vacío", () => {
    expect(resumenEstadistico([])).toEqual({
      n: 0,
      promedio: null,
      mediana: null,
      p90: null,
      p95: null,
    });
  });

  it("calcula n, promedio, mediana, p90 y p95 juntos", () => {
    const resumen = resumenEstadistico([2, 4, 6, 8, 10]);
    expect(resumen.n).toBe(5);
    expect(resumen.promedio).toBe(6);
    expect(resumen.mediana).toBe(6);
    expect(resumen.p95).toBeCloseTo(9.6, 5);
  });
});
