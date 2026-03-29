export default function SentimentBar({ positive, neutral, negative }) {
  const total = (positive || 0) + (neutral || 0) + (negative || 0)
  if (!total) return null

  return (
    <div>
      <div style={{
        display: 'flex', height: 12, borderRadius: 6,
        overflow: 'hidden', gap: 2, marginBottom: 8
      }}>
        <div style={{
          flex: positive, background: 'var(--teal)',
          transition: 'flex 0.6s ease'
        }} />
        <div style={{
          flex: neutral, background: 'var(--border)',
          transition: 'flex 0.6s ease'
        }} />
        <div style={{
          flex: negative, background: 'var(--red)',
          transition: 'flex 0.6s ease'
        }} />
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
        <span style={{ color: 'var(--teal)', fontWeight: 600 }}>
          ● {positive?.toFixed(1) || 0}% Positive
        </span>
        <span style={{ color: 'var(--ink-light)', fontWeight: 500 }}>
          ● {neutral?.toFixed(1) || 0}% Neutral
        </span>
        <span style={{ color: 'var(--red)', fontWeight: 600 }}>
          ● {negative?.toFixed(1) || 0}% Negative
        </span>
      </div>
    </div>
  )
}