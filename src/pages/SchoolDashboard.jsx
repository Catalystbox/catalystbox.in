import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ScoreCard from '../components/ScoreCard'
import DimensionBar from '../components/DimensionBar'
import SentimentBar from '../components/SentimentBar'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell
} from 'recharts'

export default function SchoolDashboard({ schoolCode, onSignOut }) {
  const [school, setSchool] = useState(null)
  const [nep, setNep] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [schoolCode])

  async function fetchData() {
    const [{ data: schoolData }, { data: nepData }, { data: warnData }, { data: snapData }] = await Promise.all([
      supabase.from('cb_master_model').select('*').eq('school_code', schoolCode).order('academic_year', { ascending: false }),
      supabase.from('nep_readiness').select('*').eq('school_code', schoolCode).order('academic_year', { ascending: false }),
      supabase.from('early_warnings').select('*').eq('school_code', schoolCode).order('severity'),
      supabase.from('annual_snapshots').select('*').eq('school_code', schoolCode).order('academic_year')
    ])

        setSchool(schoolData?.[0] || null)
    setNep(nepData?.[0] || null)
    setWarnings(warnData || [])
    setSnapshots(snapData || [])
    setLoading(false)
  }

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
      <span style={{ color: 'var(--ink-light)', fontSize: 14 }}>Loading...</span>
    </div>
  )

  if (!school) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 12
    }}>
      <p style={{ color: 'var(--ink-light)' }}>No data found for your school yet.</p>
      <button onClick={onSignOut} style={{
        background: 'var(--teal)', color: 'white', border: 'none',
        padding: '8px 20px', borderRadius: 6, cursor: 'pointer'
      }}>Sign out</button>
    </div>
  )

  // SEI dimensions
  const seiDimensions = [
    { label: 'Safety & Wellbeing', score: school.sei_safety_wellbeing },
    { label: 'Teaching Quality', score: school.sei_teaching_quality },
    { label: 'Voice & Governance', score: school.sei_voice_governance },
    { label: 'Future Readiness', score: school.sei_future_readiness },
    { label: 'Infrastructure', score: school.sei_infrastructure },
    { label: 'Happiness', score: school.sei_happiness },
  ]

  const teiDimensions = [
    { label: 'Respect & Recognition', score: school.tei_respect_recognition },
    { label: 'Workload & Support', score: school.tei_workload_support },
    { label: 'Communication', score: school.tei_communication },
    { label: 'Professional Growth', score: school.tei_professional_growth },
    { label: 'Environment', score: school.tei_environment },
  ]

  const ptiDimensions = [
    { label: 'Trust & Safety', score: school.pti_trust_safety },
    { label: 'Communication', score: school.pti_communication },
    { label: 'Holistic Dev', score: school.pti_holistic_dev },
    { label: 'Voice & Happiness', score: school.pti_voice_happiness },
  ]

  // NEP radar data
  const nepData = nep ? [
    { dim: 'Holistic Dev', value: nep.nep_holistic_development || 0 },
    { dim: 'Foundational', value: nep.nep_foundational_learning || 0 },
    { dim: 'Teacher', value: nep.nep_teacher_empowerment || 0 },
    { dim: 'Inclusive', value: nep.nep_inclusive_education || 0 },
    { dim: 'Digital', value: nep.nep_digital_integration || 0 },
    { dim: 'Governance', value: nep.nep_governance_accountability || 0 },
    { dim: 'Wellbeing', value: nep.nep_student_wellbeing || 0 },
    { dim: 'Parent', value: nep.nep_parent_community || 0 },
  ] : []

  // YoY bar chart
  const yoyData = snapshots.map(s => ({
    year: s.academic_year,
    CBI: s.cbi, SEI: s.sei, TEI: s.tei, PTI: s.pti
  }))

  const criticalWarnings = warnings.filter(w => w.severity === 'Critical')
  const highWarnings = warnings.filter(w => w.severity === 'High')
  const otherWarnings = warnings.filter(w => w.severity !== 'Critical' && w.severity !== 'High')

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
          }}>School Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>
            {school.school_name || schoolCode} · {school.academic_year}
          </span>
          <button onClick={onSignOut} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
            color: 'white', padding: '6px 14px', borderRadius: 6,
            fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* School info */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, color: 'var(--ink)' }}>
            {school.school_name || school.school_code}
          </h2>
          <p style={{ color: 'var(--ink-light)', fontSize: 14, marginTop: 4 }}>
            {[school.city, school.state, school.board].filter(Boolean).join(' · ')} · {school.total_respondents} respondents
          </p>
        </div>

        {/* Critical warnings banner */}
        {criticalWarnings.length > 0 && (
          <div style={{
            background: 'var(--red-pale)', border: '1px solid #f5c6c2',
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24
          }}>
            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 8, fontSize: 14 }}>
              ⚠ {criticalWarnings.length} Critical Warning{criticalWarnings.length > 1 ? 's' : ''}
            </div>
            {criticalWarnings.map((w, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--red)', marginBottom: 4 }}>
                <strong>{w.warning_type}:</strong> {w.warning_detail}
              </div>
            ))}
          </div>
        )}

        {/* Main KPI scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 28
        }}>
          <ScoreCard label="CATALYSTBOX INDEX" score={school.cbi}
            band={school.cbi_band} color="var(--teal)" />
          <ScoreCard label="STUDENT INDEX (SEI)" score={school.sei}
            color="#2563eb"
            sub={`Class 10: ${school.class10_sei || '—'} · Class 12: ${school.class12_sei || '—'}`} />
          <ScoreCard label="TEACHER INDEX (TEI)" score={school.tei}
            color="#7c3aed" />
          <ScoreCard label="PARENT TRUST INDEX (PTI)" score={school.pti}
            color="var(--amber)" />
        </div>

        {/* Class 10 vs 12 */}
        {(school.class10_sei || school.class12_sei) && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)', marginBottom: 24
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Class 10 vs Class 12 — Student Experience</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {[
                { label: 'Class 10', score: school.class10_sei, count: school.class10_count, color: '#2563eb' },
                { label: 'Class 12', score: school.class12_sei, count: school.class12_count, color: '#7c3aed' },
              ].map(c => (
                <div key={c.label} style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                  padding: 20, borderLeft: `4px solid ${c.color}`
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-light)', marginBottom: 8 }}>
                    {c.label} · {c.count || 0} students
                  </div>
                  <div style={{ fontSize: 36, fontFamily: 'DM Serif Display, serif', color: c.color }}>
                    {c.score ? Number(c.score).toFixed(1) : 'No data'}
                  </div>
                  {c.score && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        height: 6, background: 'var(--border)', borderRadius: 3
                      }}>
                        <div style={{
                          height: '100%', width: `${c.score}%`,
                          background: c.color, borderRadius: 3
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dimension scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 20, marginBottom: 28
        }}>
          {[
            { title: 'Student Dimensions (SEI)', dims: seiDimensions, color: '#2563eb' },
            { title: 'Teacher Dimensions (TEI)', dims: teiDimensions, color: '#7c3aed' },
            { title: 'Parent Dimensions (PTI)', dims: ptiDimensions, color: 'var(--amber)' },
          ].map(section => (
            <div key={section.title} style={{
              background: 'white', borderRadius: 'var(--radius)',
              padding: '24px', boxShadow: 'var(--shadow)'
            }}>
              <h3 style={{ fontSize: 15, marginBottom: 20, color: section.color }}>
                {section.title}
              </h3>
              {section.dims.map(d => (
                <DimensionBar
                  key={d.label}
                  label={d.label}
                  score={d.score || 0}
                  color={section.color}
                  positive={school.positive_pct}
                  negative={school.negative_pct}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Sentiment + NEP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Sentiment */}
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Sentiment Analysis</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>
              Based on open text responses
            </p>
            <SentimentBar
              positive={school.positive_pct}
              neutral={school.neutral_pct}
              negative={school.negative_pct}
            />
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12, marginTop: 20
            }}>
              {[
                { label: 'Students', val: school.student_sentiment },
                { label: 'Teachers', val: school.teacher_sentiment },
                { label: 'Parents', val: school.parent_sentiment },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 4 }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: s.val === 'Positive' ? 'var(--teal)' :
                           s.val === 'Negative' ? 'var(--red)' : 'var(--ink-light)'
                  }}>{s.val || 'No data'}</div>
                </div>
              ))}
            </div>
            {school.top_themes && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginBottom: 6 }}>Top Themes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {school.top_themes.split(',').map(t => (
                    <span key={t} style={{
                      background: 'var(--teal-pale)', color: 'var(--teal)',
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500
                    }}>{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {school.risk_themes && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginBottom: 6 }}>Risk Themes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {school.risk_themes.split(',').map(t => (
                    <span key={t} style={{
                      background: 'var(--red-pale)', color: 'var(--red)',
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500
                    }}>{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* NEP Readiness */}
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>NEP 2020 Readiness</h3>
                {nep && (
                  <span style={{
                    background: 'var(--teal-pale)', color: 'var(--teal)',
                    padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
                  }}>{nep.nep_readiness_band}</span>
                )}
              </div>
              {nep && (
                <div style={{
                  fontSize: 32, fontFamily: 'DM Serif Display, serif', color: 'var(--teal)'
                }}>
                  {Number(nep.nep_readiness_score).toFixed(1)}
                </div>
              )}
            </div>
            {nepData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={nepData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: 'var(--ink-mid)' }} />
                  <Radar dataKey="value" stroke="var(--teal)" fill="var(--teal)" fillOpacity={0.2} />
                  <Tooltip formatter={v => [v.toFixed(1) + '/100']} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--ink-light)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                NEP data not available
              </div>
            )}
            {nep && nep.primary_drag_factor_1 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginBottom: 6 }}>Priority Areas</div>
                {[nep.primary_drag_factor_1, nep.primary_drag_factor_2, nep.primary_drag_factor_3]
                  .filter(Boolean).map((d, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: 'var(--amber)', fontWeight: 500,
                    marginBottom: 3
                  }}>↓ {d}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* YoY Comparison */}
        {yoyData.length > 1 && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)', marginBottom: 28
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Year on Year Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yoyData}>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="CBI" fill="var(--teal)" radius={[4,4,0,0]} />
                <Bar dataKey="SEI" fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="TEI" fill="#7c3aed" radius={[4,4,0,0]} />
                <Bar dataKey="PTI" fill="var(--amber)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recommended Actions from NEP */}
        {nep && (nep.priority_action_1 || nep.priority_action_2) && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)', marginBottom: 28
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Recommended Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[nep.priority_action_1, nep.priority_action_2, nep.priority_action_3]
                .filter(Boolean).map((action, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px'
                }}>
                  <span style={{
                    background: 'var(--teal)', color: 'white',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Warnings */}
        {warnings.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>
              Early Warnings ({warnings.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {warnings.map((w, i) => (
                <div key={i} style={{
                  background: w.severity === 'Critical' ? 'var(--red-pale)' :
                               w.severity === 'High' ? 'var(--amber-pale)' : 'var(--surface)',
                  borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                  borderLeft: `3px solid ${
                    w.severity === 'Critical' ? 'var(--red)' :
                    w.severity === 'High' ? 'var(--amber)' : 'var(--border)'
                  }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontWeight: 600, fontSize: 13,
                      color: w.severity === 'Critical' ? 'var(--red)' :
                             w.severity === 'High' ? 'var(--amber)' : 'var(--ink)'
                    }}>{w.warning_type}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: w.severity === 'Critical' ? 'var(--red)' :
                             w.severity === 'High' ? 'var(--amber)' : 'var(--ink-light)'
                    }}>{w.severity}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-mid)', marginBottom: 6 }}>
                    {w.warning_detail}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>
                    → {w.recommended_action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


