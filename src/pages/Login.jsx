import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dim) 100%)'
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 80px', color: 'white',
        maxWidth: 560
      }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.12)', borderRadius: 8,
            padding: '6px 14px', marginBottom: 32
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--amber)'
            }} />
            <span style={{ fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>
              FRESH EYE FOUNDATION
            </span>
          </div>
          <h1 style={{
            fontSize: 52, fontFamily: 'DM Serif Display, serif',
            marginBottom: 16, lineHeight: 1.1
          }}>
            Catalyst<span style={{ color: 'var(--amber)' }}>Box</span>
          </h1>
          <p style={{ fontSize: 18, opacity: 0.8, lineHeight: 1.6, maxWidth: 380 }}>
            National Education Intelligence Infrastructure for India
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { n: '01', t: 'Anonymous Feedback', d: 'Multi-stakeholder voices collected at scale' },
            { n: '02', t: 'CatalystBox Index', d: 'SEI · TEI · PTI · CBI scoring per school' },
            { n: '03', t: 'NEP 2020 Readiness', d: '8-pillar alignment framework' },
          ].map(item => (
            <div key={item.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--amber)',
                letterSpacing: 1, paddingTop: 3
              }}>{item.n}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.t}</div>
                <div style={{ fontSize: 13, opacity: 0.65 }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40
      }}>
        <div style={{
          background: 'white', borderRadius: 20, padding: '48px 44px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{
            fontSize: 26, fontFamily: 'DM Serif Display, serif',
            color: 'var(--ink)', marginBottom: 8
          }}>Sign in</h2>
          <p style={{ color: 'var(--ink-light)', fontSize: 14, marginBottom: 32 }}>
            Access your dashboard
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--ink-mid)', marginBottom: 6
              }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@school.edu.in"
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 15, outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 500,
                color: 'var(--ink-mid)', marginBottom: 6
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 15, outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-pale)', color: 'var(--red)',
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                fontSize: 13
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--teal-light)' : 'var(--teal)',
                color: 'white', border: 'none',
                padding: '14px 24px', borderRadius: 'var(--radius-sm)',
                fontSize: 15, fontWeight: 600, marginTop: 8,
                transition: 'background 0.2s, transform 0.1s',
                transform: loading ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in to Dashboard'}
            </button>
          </form>

          <p style={{
            marginTop: 24, fontSize: 12, color: 'var(--ink-light)',
            textAlign: 'center'
          }}>
            AY2026-27 · Powered by Fresh Eye Foundation
          </p>
        </div>
      </div>
    </div>
  )
}