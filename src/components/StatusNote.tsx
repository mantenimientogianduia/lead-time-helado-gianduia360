export function StatusNote({ mensajes }: { mensajes: string[] }) {
  if (mensajes.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "rgba(139, 26, 43, 0.08)",
        color: "var(--color-danger)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {mensajes.map((m) => (
        <div key={m}>{m}</div>
      ))}
    </div>
  );
}
