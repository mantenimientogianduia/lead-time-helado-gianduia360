import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Time Helado — Gianduia360",
  description: "Seguimiento de lead time (fabricación → venta) de producto terminado helado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
