export function AppHeader() {
  return (
    <header
      style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-on-primary)",
        borderBottom: "4px solid var(--color-accent)",
        padding: "24px 40px 18px",
      }}
    >
      <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, lineHeight: 1.15 }}>
          Lead Time Helado
        </h1>
        <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "14px" }}>
          Gianduia360 — tiempo entre fabricación y venta de producto terminado helado
        </p>
      </div>
    </header>
  );
}
