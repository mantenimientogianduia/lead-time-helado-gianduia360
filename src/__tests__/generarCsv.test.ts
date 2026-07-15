import { describe, expect, it } from "vitest";
import { generarCsv } from "@/lib/csv/generarCsv";

interface Fila {
  producto: string;
  dias: number | null;
  observacion: string | null;
}

describe("generarCsv", () => {
  it("genera encabezado y filas separadas por coma", () => {
    const filas: Fila[] = [{ producto: "Pinta Cadbury", dias: 12, observacion: null }];
    const csv = generarCsv(filas, [
      { encabezado: "Producto", valor: (f) => f.producto },
      { encabezado: "Dias", valor: (f) => f.dias },
      { encabezado: "Observacion", valor: (f) => f.observacion },
    ]);
    expect(csv).toBe("Producto,Dias,Observacion\r\nPinta Cadbury,12,");
  });

  it("escapa comas, comillas y saltos de linea", () => {
    const filas: Fila[] = [
      { producto: 'Helado "Premium", Chocolate', dias: 5, observacion: "línea1\nlínea2" },
    ];
    const csv = generarCsv(filas, [
      { encabezado: "Producto", valor: (f) => f.producto },
      { encabezado: "Dias", valor: (f) => f.dias },
      { encabezado: "Observacion", valor: (f) => f.observacion },
    ]);
    expect(csv).toBe(
      'Producto,Dias,Observacion\r\n"Helado ""Premium"", Chocolate",5,"línea1\nlínea2"'
    );
  });

  it("genera solo el encabezado cuando no hay filas", () => {
    const csv = generarCsv<Fila>([], [{ encabezado: "Producto", valor: (f) => f.producto }]);
    expect(csv).toBe("Producto");
  });
});
