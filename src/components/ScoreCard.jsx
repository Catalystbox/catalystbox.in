export default function ScoreCard({ label, score, band, color, sub }) {
  const bandColors = {
    'Excellent':        { bg: '#e8f5f0', text: '#0B5C45' },
    'Good':             { bg: '#edf7ed', text: '#2d6a2d' },
    'Moderate':         { bg: '#fef9e7', text: '#b7770d' },
    'Needs Attention':  { bg: '#fef3e2', text: '#c0620a' },
    'Critical':         { bg: '#fdecea', text: '#c0392b' },
    'Insufficient Data':{ bg: '#f0f0f0', text: '#888' },
  }
  const bc = bandColors[band] || { bg: '#f0f0f0', text: '#888' }

  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius)',
      padding: '24px 28px', boxShadow: 'var(--shadow)',
      borderTop: `4px solid ${color || 'var(--teal)'}`,
      display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-light)', letterSpacing: 1 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 44, fontWeight: 700,
          fontFamily: 'DM Serif Display, serif',
          color: color || 'var(--teal)'
        }}>
          {score !== null && score !== undefined && score !== '' ? Number(score).toFixed(1) : '—'}
        </span>
        <span style={{ fontSize: 14, color: 'var(--ink-light)' }}>/100</span>
      </div>
      {band && (
        <span style={{
          display: 'inline-block', padding: '3px 10px',
          background: bc.bg, color: bc.text,
          borderRadius: 20, fontSize: 12, fontWeight: 600,
          alignSelf: 'flex-start'
        }}>{band}</span>
      )}
      {sub && <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{sub}</span>}
    </div>
  )
}