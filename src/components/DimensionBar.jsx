export default function DimensionBar({ label, score, maxScore = 100, positive, negative, color }) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100))
  const barColor = color || (pct >= 65 ? "var(--teal)" : pct >= 50 ? "var(--amber)" : "var(--red)")
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 6
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{label}</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {positive !== undefined && (
            <span style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600 }}>
              ? {positive}%
            </span>
          )}
          {negative !== undefined && (
            <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>
              ? {negative}%
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
            {score !== null && score !== "" ? Number(score).toFixed(1) : "-"}
          </span>
        </div>
      </div>
      <div style={{
        height: 8, background: "var(--border)",
        borderRadius: 4, overflow: "hidden"
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: barColor, borderRadius: 4,
          transition: "width 0.8s ease"
        }} />
      </div>
    </div>
  )
}
