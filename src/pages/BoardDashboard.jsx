import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ScoreCard from '../components/ScoreCard'
import DimensionBar from '../components/DimensionBar'
import SentimentBar from '../components/SentimentBar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, PieChart, Pie, Legend
} from 'recharts'

const BAND_COLOR = {
  'Excellent':       '#0B5C45',
  'Good':            '#2d6a2d',
  'Moderate':        '#b7770d',
  'Needs Attention': '#c0620a',
  'Critical':        '#c0392b',
}

export default function BoardDashboard({ onSignOut }) {
  const [schools, setSchools] = useState([])
  const [nep, setNep] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeYear, setActiveYear] = useState('AY2026-27')
  const [sortBy, setSortBy] = useState('cbi')
  const [filterBoard, setFilterBoard] = useState('All')
  const [filterRisk, setFilterRisk] = useState('All')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: schoolData }, { data: nepData }, { data: snapData }] = await Promise.all([
      supabase.from('cb_master_model').select('*').order('cbi', { ascending: false }),
      supabase.from('nep_readiness').select('*'),
      supabase.from('annual_snapshots').select('*').order('snapshot_date', { ascending: true })
    ])
    setSchools(schoolData || [])
    setNep(nepData || [])
    setSnapshots(snapData || [])
    setLoading(false)
  }

  const yearSchools = schools.filter(s => s.academic_year === activeYear)
  const boards = ['All', ...new Set(yearSchools.map(s => s.board).filter(Boolean))]
  const risks = ['All', 'Critical', 'High', 'Medium', 'Low', 'Minimal']

  const filtered = yearSchools
    .filter(s => filterBoard === 'All' || s.board === filterBoard)
    .filter(s => filterRisk === 'All' || s.overall_risk_band === filterRisk)
    .sort((a, b) => {
      if (sortBy === 'cbi') return (b.cbi || 0) - (a.cbi || 0)
      if (sortBy === 'sei') return (b.sei || 0) - (a.sei || 0)
      if (sortBy === 'risk') return (b.overall_risk_score || 0) - (a.overall_risk_score || 0)
      return (a.school_name || '').localeCompare(b.school_name || '')
    })

  // Aggregates
  const avgCBI = yearSchools.length
    ? (yearSchools.reduce((s, x) => s + (x.cbi || 0), 0) / yearSchools.length).toFixed(1)
    : '—'
  const avgSEI = yearSchools.length
    ? (yearSchools.reduce((s, x) => s + (x.sei || 0), 0) / yearSchools.length).toFixed(1)
    : '—'
  const totalResp = yearSchools.reduce((s, x) => s + (x.total_respondents || 0), 0)
  const criticalCount = yearSchools.filter(s => s.overall_risk_band === 'Critical').length

  // Band distribution for pie chart
  const bandDist = Object.entries(
    yearSchools.reduce((acc, s) => {
      const b = s.cbi_band || 'Unknown'
      acc[b] = (acc[b] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value, fill: BAND_COLOR[name] || '#ccc' }))

  // State level data
  const stateData = Object.entries(
    yearSchools.reduce((acc, s) => {
      if (!s.state) return acc
      if (!acc[s.state]) acc[s.state] = { cbi: [], count: 0 }
      acc[s.state].cbi.push(s.cbi || 0)
      acc[s.state].count++
      return acc
    }, {})
  ).map(([state, d]) => ({
    state,
    avgCBI: (d.cbi.reduce((a, b) => a + b, 0) / d.cbi.length).toFixed(1),
    schools: d.count
  })).sort((a, b) => b.avgCBI - a.avgCBI)

  // YoY data per school
  const yoySchools = [...new Set(snapshots.map(s => s.school_code))]
  const years = [...new Set(snapshots.map(s => s.academic_year))].sort()

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 12
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid var(--border)',
        borderTopColor: 'var(--teal)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'var(--ink-light)', fontSize: 14 }}>Loading dashboard...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--teal)', color: 'white',
        padding: '0 32px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        height: 64, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>
            Catalyst<span style={{ color: 'var(--amber)' }}>Box</span>
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 6,
            padding: '2px 10px', fontSize: 12, fontWeight: 600
          }}>Board Intelligence</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <select
            value={activeYear}
            onChange={e => setActiveYear(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', borderRadius: 6, padding: '6px 12px',
              fontSize: 13, cursor: 'pointer'
            }}
          >
            {[...new Set(schools.map(s => s.academic_year))].map(y => (
              <option key={y} value={y} style={{ color: 'var(--ink)', background: 'white' }}>{y}</option>
            ))}
          </select>
          <button
            onClick={onSignOut}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
              color: 'white', padding: '6px 14px', borderRadius: 6,
              fontSize: 13, fontWeight: 500
            }}
          >Sign out</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Summary KPIs */}
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>
            National Overview
          </h2>
          <p style={{ color: 'var(--ink-light)', fontSize: 14 }}>
            {activeYear} · {yearSchools.length} schools · {totalResp.toLocaleString()} respondents
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 28
        }}>
          <ScoreCard label="AVG CATALYSTBOX INDEX" score={avgCBI}
            band={avgCBI >= 80 ? 'Excellent' : avgCBI >= 65 ? 'Good' : avgCBI >= 50 ? 'Moderate' : 'Needs Attention'}
            color="var(--teal)" />
          <ScoreCard label="AVG STUDENT INDEX" score={avgSEI} color="#2563eb" />
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px 28px', boxShadow: 'var(--shadow)',
            borderTop: '4px solid var(--amber)'
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-light)', letterSpacing: 1 }}>
              SCHOOLS ONBOARDED
            </span>
            <div style={{ fontSize: 44, fontFamily: 'DM Serif Display, serif', color: 'var(--amber)', marginTop: 8 }}>
              {yearSchools.length}
            </div>
          </div>
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px 28px', boxShadow: 'var(--shadow)',
            borderTop: `4px solid ${criticalCount > 0 ? 'var(--red)' : 'var(--teal)'}`
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-light)', letterSpacing: 1 }}>
              CRITICAL RISK SCHOOLS
            </span>
            <div style={{
              fontSize: 44, fontFamily: 'DM Serif Display, serif',
              color: criticalCount > 0 ? 'var(--red)' : 'var(--teal)', marginTop: 8
            }}>
              {criticalCount}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* CBI Band Distribution */}
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>CBI Band Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bandDist} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {bandDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* State Level Heatmap */}
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>State Level Performance</h3>
            {stateData.length === 0 ? (
              <div style={{ color: 'var(--ink-light)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                State data available when school directory is populated
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stateData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="state" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => [v + '/100', 'Avg CBI']} />
                  <Bar dataKey="avgCBI" radius={[0, 4, 4, 0]}>
                    {stateData.map((entry, i) => (
                      <Cell key={i} fill={
                        entry.avgCBI >= 65 ? 'var(--teal)' :
                        entry.avgCBI >= 50 ? 'var(--amber)' : 'var(--red)'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* YoY Comparison */}
        {years.length > 1 && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)', marginBottom: 28
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Year on Year — CBI Trend</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--teal-pale)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>School</th>
                    {years.map(y => (
                      <th key={y} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{y}</th>
                    ))}
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {yoySchools.map(code => {
                    const schoolSnaps = snapshots.filter(s => s.school_code === code)
                    const byYear = {}
                    schoolSnaps.forEach(s => { byYear[s.academic_year] = s.cbi })
                    const vals = years.map(y => byYear[y])
                    const first = vals.find(v => v != null)
                    const last = vals.slice().reverse().find(v => v != null)
                    const delta = first && last ? (last - first).toFixed(1) : null

                    return (
                      <tr key={code} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 500 }}>{code}</td>
                        {years.map(y => (
                          <td key={y} style={{ padding: '10px 16px', textAlign: 'center' }}>
                            {byYear[y] ? (
                              <span style={{
                                fontWeight: 600,
                                color: byYear[y] >= 65 ? 'var(--teal)' :
                                       byYear[y] >= 50 ? 'var(--amber)' : 'var(--red)'
                              }}>{byYear[y]}</span>
                            ) : '—'}
                          </td>
                        ))}
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {delta !== null && (
                            <span style={{
                              color: delta >= 0 ? 'var(--teal)' : 'var(--red)',
                              fontWeight: 700
                            }}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* School Rankings Table */}
        <div style={{
          background: 'white', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)', overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12
          }}>
            <h3 style={{ fontSize: 16 }}>School Rankings</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select value={filterBoard} onChange={e => setFilterBoard(e.target.value)}
                style={{
                  border: '1.5px solid var(--border)', borderRadius: 6,
                  padding: '6px 12px', fontSize: 13, cursor: 'pointer'
                }}>
                {boards.map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                style={{
                  border: '1.5px solid var(--border)', borderRadius: 6,
                  padding: '6px 12px', fontSize: 13, cursor: 'pointer'
                }}>
                {risks.map(r => <option key={r}>{r}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{
                  border: '1.5px solid var(--border)', borderRadius: 6,
                  padding: '6px 12px', fontSize: 13, cursor: 'pointer'
                }}>
                <option value="cbi">Sort: CBI</option>
                <option value="sei">Sort: SEI</option>
                <option value="risk">Sort: Risk</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  {['#', 'School', 'City', 'Board', 'CBI', 'SEI', 'TEI', 'PTI',
                    'Risk Band', 'Sentiment', 'Warnings'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontWeight: 600, color: 'var(--ink-mid)',
                      fontSize: 11, letterSpacing: 0.5,
                      borderBottom: '1px solid var(--border)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((school, i) => (
                  <tr key={school.school_code}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-pale)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', color: 'var(--ink-light)', fontWeight: 600 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{school.school_name || school.school_code}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-light)' }}>{school.school_code}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--ink-mid)' }}>
                      {school.city || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--ink-mid)' }}>
                      {school.board || '—'}
                    </td>
                    {[school.cbi, school.sei, school.tei, school.pti].map((score, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: score >= 65 ? 'var(--teal)' :
                                 score >= 50 ? 'var(--amber)' : 'var(--red)'
                        }}>
                          {score ? Number(score).toFixed(1) : '—'}
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600,
                        background: school.overall_risk_band === 'Critical' ? 'var(--red-pale)' :
                                    school.overall_risk_band === 'High' ? 'var(--amber-pale)' :
                                    'var(--teal-pale)',
                        color: school.overall_risk_band === 'Critical' ? 'var(--red)' :
                               school.overall_risk_band === 'High' ? 'var(--amber)' :
                               'var(--teal)'
                      }}>
                        {school.overall_risk_band || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: school.sentiment_band === 'Positive' ? 'var(--teal)' :
                               school.sentiment_band === 'Negative' ? 'var(--red)' :
                               'var(--ink-light)',
                        fontWeight: 500, fontSize: 12
                      }}>
                        {school.sentiment_band || 'No Data'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {school.warning_count > 0 && (
                        <span style={{
                          background: school.critical_warning_count > 0 ? 'var(--red-pale)' : 'var(--amber-pale)',
                          color: school.critical_warning_count > 0 ? 'var(--red)' : 'var(--amber)',
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600
                        }}>
                          {school.warning_count} ({school.critical_warning_count} critical)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{
                      padding: 40, textAlign: 'center',
                      color: 'var(--ink-light)', fontSize: 14
                    }}>
                      No schools match the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}