"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/resumen", label: "Resumen" },
  { href: "/camara", label: "Cámara en vivo" },
];

export function TabsNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: "8px",
        maxWidth: "var(--layout-max-width)",
        margin: "0 auto",
        padding: "12px 40px 0",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "inline-block",
              height: "38px",
              lineHeight: "38px",
              padding: "0 16px",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              fontSize: "12px",
              textDecoration: "none",
              backgroundColor: active ? "var(--color-danger)" : "transparent",
              color: active ? "var(--color-on-primary)" : "var(--color-text-muted)",
              transition: "background-color var(--motion-base) var(--motion-easing)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
