import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// Prevents session hijacking when creating new users
let _blockAuthChange = false

const C = {
  bg: '#07090F', surface: '#0D1117', card: '#111827',
  border: '#1A2535', border2: '#243044',
  accent: '#3B82F6', accentGlow: '#3B82F615',
  green: '#22C55E', greenDim: '#22C55E15',
  yellow: '#F59E0B', yellowDim: '#F59E0B15',
  red: '#EF4444', redDim: '#EF444415',
  purple: '#A855F7', purpleDim: '#A855F715',
  text: '#F0F4FF', muted: '#64748B', muted2: '#94A3B8',
}

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};font-family:'Plus Jakarta Sans',sans-serif;}
  input,select,textarea{font-family:inherit;}
  input::placeholder,textarea::placeholder{color:${C.muted};}
  input:focus,select:focus,textarea:focus{outline:none;border-color:${C.accent}60!important;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:${C.surface};}
  ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  .fade-up{animation:fadeUp .3s ease forwards;}
  .spin{animation:spin .7s linear infinite;}
`

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
    {children}
  </div>
)

const Inp = ({ value, onChange, placeholder, type = 'text', disabled, style: sx }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{ width: '100%', padding: '10px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, opacity: disabled ? 0.5 : 1, ...sx }} />
)

const Sel = ({ value, onChange, children, style: sx }) => (
  <select value={value} onChange={onChange}
    style={{ width: '100%', padding: '10px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, cursor: 'pointer', ...sx }}>
    {children}
  </select>
)

const Btn = ({ onClick, children, variant = 'primary', small, disabled, loading, style: sx }) => {
  const base = {
    padding: small ? '7px 14px' : '11px 22px', borderRadius: 8, border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    fontSize: small ? 12 : 13, fontWeight: 700, transition: 'opacity .15s',
    opacity: disabled || loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, ...sx,
  }
  const colors = {
    primary: { background: C.accent, color: '#fff' },
    ghost: { background: 'transparent', color: C.muted2, border: `1px solid ${C.border}` },
    danger: { background: C.redDim, color: C.red, border: `1px solid ${C.red}25` },
    success: { background: C.greenDim, color: C.green, border: `1px solid ${C.green}25` },
    purple: { background: C.purpleDim, color: C.purple, border: `1px solid ${C.purple}25` },
  }
  return (
    <button style={{ ...base, ...colors[variant] }} onClick={onClick} disabled={disabled || loading}>
      {loading && <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} className="spin" />}
      {children}
    </button>
  )
}

const Card = ({ children, style: sx }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, ...sx }}>{children}</div>
)

const Tag = ({ label, color, bg }) => (
  <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: bg, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
)

const PctBar = ({ value, height = 5 }) => {
  const color = value >= 85 ? C.green : value >= 75 ? C.yellow : C.red
  return (
    <div style={{ height, background: C.bg, borderRadius: height, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: height, transition: 'width .5s ease' }} />
    </div>
  )
}

const Stat = ({ value, label, color }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || C.text, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
  </div>
)

const Alert = ({ msg, type = 'error' }) => !msg ? null : (
  <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 500,
    background: type === 'error' ? C.redDim : C.greenDim, color: type === 'error' ? C.red : C.green,
    border: `1px solid ${type === 'error' ? C.red : C.green}30` }}>{msg}</div>
)

const Spinner = ({ size = 20 }) => (
  <div style={{ width: size, height: size, border: `2px solid ${C.border2}`, borderTopColor: C.accent, borderRadius: '50%' }} className="spin" />
)

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: '#000000a0', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }} className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>x</button>
      </div>
      {children}
    </div>
  </div>
)

const Logo = ({ size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.22, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.44, fontWeight: 900, color: '#fff', flexShrink: 0 }}>C</div>
)

const statusColor = s => s === 'P' ? C.green : s === 'A' ? C.red : C.yellow
const statusBg = s => s === 'P' ? C.greenDim : s === 'A' ? C.redDim : C.yellowDim

const TopNav = ({ profile, school, onLogout, tab, setTab, tabs }) => (
  <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, position: 'sticky', top: 0, zIndex: 100 }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 54 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28 }}>
        <Logo size={28} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, lineHeight: 1 }}>CatalystBox</div>
          {school && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{school.name}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '6px 13px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 600, transition: 'all .15s',
            background: tab === t.id ? C.accentGlow : 'transparent',
            color: tab === t.id ? C.accent : C.muted,
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{profile?.name}</div>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{profile?.role}</div>
        </div>
        <Btn onClick={onLogout} variant="ghost" small>Sign out</Btn>
      </div>
    </div>
  </div>
)

// ─── AUTH ─────────────────────────────────────────────────────
const AuthScreen = () => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) }
  }

  const handleForgot = async () => {
    if (!email) { setError('Enter your email first'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Reset email sent. Check your inbox.')
    setMode('login')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{GS}</style>
      <div style={{ width: '100%', maxWidth: 400 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size={52} />
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginTop: 14 }}>CatalystBox</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Attendance Intelligence</div>
        </div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 18 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Reset your password'}
          </div>
          <Alert msg={error} />
          <Alert msg={success} type="success" />
          <Field label="Email">
            <Inp value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.in" type="email" />
          </Field>
          {mode === 'login' && (
            <Field label="Password">
              <Inp value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" />
            </Field>
          )}
          {mode === 'login'
            ? <Btn onClick={handleLogin} loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Sign In</Btn>
            : <Btn onClick={handleForgot} loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Send Reset Email</Btn>
          }
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: C.accent, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── SUPERADMIN ───────────────────────────────────────────────
const SuperAdminPortal = ({ profile }) => {
  const [tab, setTab] = useState('schools')
  const [schools, setSchools] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editSchool, setEditSchool] = useState(null)
  const [editAdmin, setEditAdmin] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', city: '', state: '', board: 'CBSE', phone: '' })
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
  const [step, setStep] = useState(1)
  const [newSchoolId, setNewSchoolId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadSchools() }, [])

  const loadSchools = async () => {
    setLoading(true)
    const [sch, adm] = await Promise.all([
      supabase.from('schools').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'admin')
    ])
    setSchools(sch.data || [])
    setAdmins(adm.data || [])
    setLoading(false)
  }

  const updateAdmin = async () => {
    if (!editAdmin) return
    setSaving(true); setErr('')
    const { error } = await supabase.from('profiles').update({
      name: editAdmin.name, phone: editAdmin.phone
    }).eq('id', editAdmin.id)
    if (error) { setErr(error.message); setSaving(false); return }
    setSuccess('Admin updated!'); setEditAdmin(null); loadSchools(); setSaving(false)
  }

  const createSchool = async () => {
    if (!form.name || !form.email) { setErr('Name and email required'); return }
    setSaving(true); setErr('')
    const { data, error } = await supabase.from('schools').insert([form]).select().single()
    if (error) { setErr(error.message); setSaving(false); return }
    setNewSchoolId(data.id)
    setStep(2)
    setSaving(false)
  }

  const updateSchool = async () => {
    if (!editSchool) return
    setSaving(true); setErr('')
    const { error } = await supabase.from('schools').update({
      name: editSchool.name, email: editSchool.email, city: editSchool.city,
      state: editSchool.state, board: editSchool.board, phone: editSchool.phone
    }).eq('id', editSchool.id)
    if (error) { setErr(error.message); setSaving(false); return }
    setSuccess('School updated!'); setEditSchool(null); loadSchools(); setSaving(false)
  }

  const deleteSchool = async (id) => {
    if (!window.confirm('Delete this school? This will remove all data including students, classes and teachers.')) return
    await supabase.from('attendance').delete().eq('school_id', id)
    await supabase.from('students').delete().eq('school_id', id)
    await supabase.from('classes').delete().eq('school_id', id)
    await supabase.from('profiles').delete().eq('school_id', id)
    await supabase.from('schools').delete().eq('id', id)
    setSuccess('School deleted'); loadSchools()
  }

  const createAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) { setErr('All fields required'); return }
    setSaving(true); setErr('')
    _blockAuthChange = true  // block session change
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: adminForm.email, password: adminForm.password,
      options: { emailRedirectTo: window.location.origin }
    })
    _blockAuthChange = false  // unblock
    if (authErr) { setErr(authErr.message); setSaving(false); return }
    const { error: profileErr } = await supabase.from('profiles').insert([{
      id: authData.user.id, school_id: newSchoolId,
      name: adminForm.name, email: adminForm.email, role: 'admin',
    }])
    if (profileErr) { setErr(profileErr.message); setSaving(false); return }
    setSuccess(`School created! Admin login: ${adminForm.email}`)
    setShowAdd(false); setStep(1)
    setForm({ name: '', email: '', city: '', state: '', board: 'CBSE', phone: '' })
    setAdminForm({ name: '', email: '', password: '' })
    loadSchools(); setSaving(false)
  }

  const updatePlan = async (schoolId, plan) => {
    await supabase.from('schools').update({ subscription_plan: plan }).eq('id', schoolId)
    loadSchools()
  }

  const TABS = [{ id: 'schools', label: 'All Schools' }, { id: 'admins', label: 'Admins' }, { id: 'billing', label: 'Subscriptions' }]

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <style>{GS}</style>
      <TopNav profile={profile} school={null} onLogout={() => supabase.auth.signOut()} tab={tab} setTab={setTab} tabs={TABS} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {tab === 'schools' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Registered Schools</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Each school is an isolated tenant</div>
              </div>
              <Btn onClick={() => setShowAdd(true)}>+ Onboard New School</Btn>
            </div>
            <Alert msg={success} type="success" />
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schools.map(s => (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Logo size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.email} · {s.city}, {s.state} · {s.board}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Tag label={(s.subscription_plan || 'trial').toUpperCase()} color={s.subscription_plan === 'trial' ? C.yellow : C.green} bg={s.subscription_plan === 'trial' ? C.yellowDim : C.greenDim} />
                      <Sel value={s.subscription_plan || 'trial'} onChange={e => updatePlan(s.id, e.target.value)} style={{ width: 110 }}>
                        {['trial', 'basic', 'pro'].map(p => <option key={p} value={p}>{p}</option>)}
                      </Sel>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{new Date(s.created_at).toLocaleDateString('en-IN')}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn onClick={() => setEditSchool({...s})} variant="ghost" small>Edit</Btn>
                      <Btn onClick={() => deleteSchool(s.id)} variant="danger" small>Delete</Btn>
                    </div>
                  </div>
                ))}
                {!schools.length && <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 14 }}>No schools yet. Click Onboard New School to get started.</div>}
              </div>
            )}
          </div>
        )}
        {tab === 'billing' && (
          <div className="fade-up">
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 24 }}>Subscriptions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {['trial', 'basic', 'pro'].map(plan => (
                <Stat key={plan} value={schools.filter(s => s.subscription_plan === plan).length}
                  label={`${plan} schools`} color={plan === 'trial' ? C.yellow : plan === 'basic' ? C.accent : C.green} />
              ))}
            </div>
          </div>
        )}
        {tab === 'admins' && (
          <div className="fade-up">
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 24 }}>System Admins</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {admins.map(a => {
                const sch = schools.find(s => s.id === a.school_id)
                return (
                  <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: C.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.accent, flexShrink: 0 }}>{a.name?.[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.email} · {a.phone || 'No phone'} · {sch?.name || 'No school'}</div>
                    </div>
                    <Tag label="ADMIN" color={C.accent} bg={C.accentGlow} />
                    <Btn onClick={() => setEditAdmin({...a})} variant="ghost" small>Edit</Btn>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {editAdmin && (
        <Modal title="Edit Admin" onClose={() => { setEditAdmin(null); setErr('') }}>
          <Alert msg={err} />
          <Field label="Full Name"><Inp value={editAdmin.name} onChange={e => setEditAdmin(p => ({...p, name: e.target.value}))} placeholder="Admin Name" /></Field>
          <Field label="Phone"><Inp value={editAdmin.phone || ''} onChange={e => setEditAdmin(p => ({...p, phone: e.target.value}))} placeholder="+91..." /></Field>
          <Btn onClick={updateAdmin} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Save Changes</Btn>
        </Modal>
      )}

      {editSchool && (
        <Modal title="Edit School" onClose={() => { setEditSchool(null); setErr('') }}>
          <Alert msg={err} />
          <Field label="School Name"><Inp value={editSchool.name} onChange={e => setEditSchool(p => ({...p, name: e.target.value}))} placeholder="School Name" /></Field>
          <Field label="Official Email"><Inp value={editSchool.email} onChange={e => setEditSchool(p => ({...p, email: e.target.value}))} placeholder="admin@school.in" type="email" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="City"><Inp value={editSchool.city || ''} onChange={e => setEditSchool(p => ({...p, city: e.target.value}))} placeholder="Lucknow" /></Field>
            <Field label="State"><Inp value={editSchool.state || ''} onChange={e => setEditSchool(p => ({...p, state: e.target.value}))} placeholder="Uttar Pradesh" /></Field>
          </div>
          <Field label="Board">
            <Sel value={editSchool.board || 'CBSE'} onChange={e => setEditSchool(p => ({...p, board: e.target.value}))}>
              {['CBSE', 'ICSE', 'UP Board', 'IB', 'Other'].map(b => <option key={b}>{b}</option>)}
            </Sel>
          </Field>
          <Field label="Phone"><Inp value={editSchool.phone || ''} onChange={e => setEditSchool(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" /></Field>
          <Btn onClick={updateSchool} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Save Changes</Btn>
        </Modal>
      )}

      {showAdd && (
        <Modal title={step === 1 ? 'New School - Details' : 'Create School Admin Account'} onClose={() => { setShowAdd(false); setStep(1); setErr('') }}>
          <Alert msg={err} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['School Info', 'Admin Login'].map((s, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i + 1 <= step ? C.accent : C.border }} />
            ))}
          </div>
          {step === 1 ? (
            <>
              <Field label="School Name"><Inp value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Delhi Public School, Lucknow" /></Field>
              <Field label="Official Email"><Inp value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@school.in" type="email" /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="City"><Inp value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Lucknow" /></Field>
                <Field label="State"><Inp value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="Uttar Pradesh" /></Field>
              </div>
              <Field label="Board">
                <Sel value={form.board} onChange={e => setForm(p => ({ ...p, board: e.target.value }))}>
                  {['CBSE', 'ICSE', 'UP Board', 'IB', 'Other'].map(b => <option key={b}>{b}</option>)}
                </Sel>
              </Field>
              <Field label="Phone"><Inp value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" /></Field>
              <Btn onClick={createSchool} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Continue</Btn>
            </>
          ) : (
            <>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: C.accentGlow, border: `1px solid ${C.accent}30`, fontSize: 13, color: C.muted2, marginBottom: 16, lineHeight: 1.6 }}>
                This admin will log in and set up the principal, teachers, classes, and students for this school.
              </div>
              <Field label="Admin Name"><Inp value={adminForm.name} onChange={e => setAdminForm(p => ({ ...p, name: e.target.value }))} placeholder="Rajesh Kumar" /></Field>
              <Field label="Admin Email"><Inp value={adminForm.email} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@school.in" type="email" /></Field>
              <Field label="Password"><Inp value={adminForm.password} onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" type="password" /></Field>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={() => setStep(1)} variant="ghost" style={{ flex: 1, justifyContent: 'center' }}>Back</Btn>
                <Btn onClick={createAdmin} loading={saving} style={{ flex: 2, justifyContent: 'center' }}>Create School + Admin</Btn>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

// ─── ADMIN PORTAL ─────────────────────────────────────────────
const AdminPortal = ({ profile, school }) => {
  const [tab, setTab] = useState('setup')
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [principals, setPrincipals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(null)
  const [selClass, setSelClass] = useState(null)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', subject: '', is_class_teacher: false })
  const [batchClasses, setBatchClasses] = useState([{ grade: '10', section: 'A' }])
  const [studentCsvText, setStudentCsvText] = useState('')
  const [teacherCsvText, setTeacherCsvText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editItem, setEditItem] = useState(null)

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (classes.length && !selClass) setSelClass(classes[0]) }, [classes])

  const loadAll = async () => {
    setLoading(true)
    const [cls, tch, stu, prin] = await Promise.all([
      supabase.from('classes').select('*').eq('school_id', school.id).order('name'),
      supabase.from('profiles').select('*').eq('role', 'teacher').eq('school_id', school.id),
      supabase.from('students').select('*').eq('school_id', school.id).order('name'),
      supabase.from('profiles').select('*').eq('role', 'principal').eq('school_id', school.id),
    ])
    setClasses(cls.data || [])
    setTeachers(tch.data || [])
    setStudents(stu.data || [])
    setPrincipals(prin.data || [])
    setLoading(false)
  }

  const createUser = async (role) => {
    if (!form.name || !form.email || !form.password) { setErr('All fields required'); return }
    setSaving(true); setErr('')
    _blockAuthChange = true  // block session change
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    _blockAuthChange = false  // unblock
    if (error) { setErr(error.message); setSaving(false); return }
    const { error: pErr } = await supabase.from('profiles').insert([{
      id: data.user.id, school_id: school.id, name: form.name, email: form.email, role,
      ...(role === 'teacher' ? { subject: form.subject, is_class_teacher: form.is_class_teacher } : {})
    }])
    if (pErr) { setErr(pErr.message); setSaving(false); return }
    setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} created: ${form.email}`)
    setShowModal(null); setForm({ name: '', email: '', password: '', subject: '', is_class_teacher: false })
    loadAll(); setSaving(false)
  }

  const deleteTeacher = async (id) => {
    if (!window.confirm('Remove this teacher?')) return
    await supabase.from('profiles').delete().eq('id', id)
    setSuccess('Teacher removed'); loadAll()
  }

  const updateProfile = async (id, updates) => {
    setSaving(true); setErr('')
    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) { setErr(error.message); setSaving(false); return }
    setSuccess('Updated successfully!'); setEditItem(null); loadAll(); setSaving(false)
  }

  const updateStudent = async (id, updates) => {
    setSaving(true); setErr('')
    const { error } = await supabase.from('students').update(updates).eq('id', id)
    if (error) { setErr(error.message); setSaving(false); return }
    setSuccess('Student updated!'); setEditItem(null); loadAll(); setSaving(false)
  }

  const deleteStudent = async (id) => {
    await supabase.from('students').delete().eq('id', id)
    loadAll()
  }

  const deleteClass = async (id) => {
    if (!window.confirm('Delete this class? This will also delete all students in it.')) return
    await supabase.from('students').delete().eq('class_id', id)
    await supabase.from('classes').delete().eq('id', id)
    setSuccess('Class deleted'); loadAll()
  }

  // Batch create multiple classes at once
  const createBatchClasses = async () => {
    setSaving(true); setErr('')
    const rows = batchClasses.filter(c => c.grade && c.section).map(c => ({
      school_id: school.id, grade: c.grade, section: c.section
    }))
    if (!rows.length) { setErr('Add at least one class'); setSaving(false); return }
    const { error } = await supabase.from('classes').insert(rows)
    if (error) {
      if (error.message.includes('classes_school_id_grade_section_key')) {
        setErr('One or more of these classes already exist in your school.')
      } else {
        setErr(error.message)
      }
      setSaving(false)
      return
    }
    setSuccess(`${rows.length} class(es) created!`)
    setShowModal(null); setBatchClasses([{ grade: '10', section: 'A' }])
    loadAll(); setSaving(false)
  }

  // Import students from CSV — auto-creates classes if needed
  // Format: Name, Roll No, Class, Section  (Class and Section auto-create the class)
  const importStudentsCSV = async () => {
    setSaving(true); setErr('')
    const lines = studentCsvText.trim().split('\n').filter(Boolean)
    if (!lines.length) { setErr('No data to import'); setSaving(false); return }

    // Parse lines
    const parsed = lines.map((line, i) => {
      const parts = line.split(',').map(s => s.trim())
      return { 
        name: parts[0], 
        roll: parts[1] || String(i+1).padStart(2,'0'), 
        grade: (parts[2] || '').toUpperCase(), 
        section: (parts[3] || 'A').toUpperCase() 
      }
    }).filter(r => r.name)

    // Find or create classes
    const classMap = {}
    classes.forEach(c => { classMap[c.name] = c.id })

    const uniqueClasses = [...new Set(parsed.filter(r => r.grade).map(r => `${r.grade}${r.section}`))]
    for (const cn of uniqueClasses) {
      if (!classMap[cn]) {
        const grade = cn.slice(0, -1)
        const section = cn.slice(-1)
        const { data } = await supabase.from('classes').insert([{ school_id: school.id, grade, section }]).select().single()
        if (data) classMap[cn] = data.id
      }
    }

    // Build student rows
    const rows = parsed.map((r, i) => {
      const cn = r.grade ? `${r.grade}${r.section}` : null
      const classId = cn ? classMap[cn] : (selClass?.id || null)
      return { school_id: school.id, class_id: classId, name: r.name, roll_no: r.roll }
    }).filter(r => r.class_id)

    if (!rows.length) { setErr('Could not match students to classes. Make sure Class column is filled.'); setSaving(false); return }

    const { error } = await supabase.from('students').insert(rows)
    if (error) { setErr(error.message); setSaving(false); return }
    setSuccess(`${rows.length} students imported!`)
    setStudentCsvText(''); setShowModal(null); loadAll(); setSaving(false)
  }

  // Import teachers from CSV
  // Format: Name, Email, Password, Subject
  const importTeachersCSV = async () => {
    setSaving(true); setErr('')
    const lines = teacherCsvText.trim().split('\n').filter(Boolean)
    if (!lines.length) { setErr('No data to import'); setSaving(false); return }
    let created = 0
    for (const line of lines) {
      const [name, email, password, subject] = line.split(',').map(s => s.trim())
      if (!name || !email || !password) continue
      _blockAuthChange = true
      const { data, error } = await supabase.auth.signUp({ email, password })
      _blockAuthChange = false
      if (error) continue
      await supabase.from('profiles').insert([{ id: data.user.id, school_id: school.id, name, email, role: 'teacher' }])
      created++
    }
    setSuccess(`${created} teacher(s) created!`)
    setTeacherCsvText(''); setShowModal(null); loadAll(); setSaving(false)
  }

  const checklist = [
    { label: 'Principal added', done: principals.length > 0, action: () => { setShowModal('principal') } },
    { label: 'Classes created', done: classes.length > 0, action: () => setShowModal('class') },
    { label: 'Teachers added', done: teachers.length > 0, action: () => setShowModal('teacher') },
    { label: 'Students imported', done: students.length > 0, action: () => setShowModal('students') },
  ]

  const TABS = [
    { id: 'setup', label: 'Setup' },
    { id: 'principals', label: `Principals (${principals.length})` },
    { id: 'classes', label: `Classes (${classes.length})` },
    { id: 'teachers', label: `Teachers (${teachers.length})` },
    { id: 'students', label: `Students (${students.length})` },
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>

  return (
    <>
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2, paddingTop: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 15px', borderRadius: '6px 6px 0 0',
              border: `1px solid ${tab === t.id ? C.border : 'transparent'}`,
              borderBottom: tab === t.id ? `1px solid ${C.card}` : 'none',
              background: tab === t.id ? C.card : 'transparent',
              color: tab === t.id ? C.text : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        <Alert msg={err} />
        <Alert msg={success} type="success" />

        {/* ── SETUP TAB ── */}
        {tab === 'setup' && (
          <div className="fade-up">
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>School Setup — {school.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Complete these steps to get your school ready.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
              {checklist.map((item, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${item.done ? C.green+'30' : C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.done ? C.greenDim : C.surface, border: `2px solid ${item.done ? C.green : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.green, fontWeight: 900, flexShrink: 0 }}>
                    {item.done ? '✓' : i+1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</div>
                    {item.done && <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>Completed</div>}
                  </div>
                  <Btn onClick={item.action} small variant={item.done ? 'ghost' : 'primary'}>
                    {item.done ? 'Manage' : 'Add Now'}
                  </Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CLASSES TAB ── */}
        {tab === 'classes' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Classes</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Add multiple classes and sections at once</div>
              </div>
              <Btn onClick={() => setShowModal('class')} small>+ Add Classes</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
              {classes.map(c => (
                <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 14px', textAlign: 'center', position: 'relative' }}>
                  <button onClick={() => deleteClass(c.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.accent }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{students.filter(s => s.class_id === c.id).length} students</div>
                </div>
              ))}
              {!classes.length && <div style={{ color: C.muted, fontSize: 13, gridColumn: '1/-1' }}>No classes yet. Click Add Classes to get started.</div>}
            </div>
          </div>
        )}

        {/* ── PRINCIPALS TAB ── */}
        {tab === 'principals' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Principals</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Manage school principals</div>
              </div>
              <Btn onClick={() => setShowModal('principal')} small>+ Add Principal</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {principals.map(p => (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: C.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.accent, flexShrink: 0 }}>{p.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{p.email} · {p.phone || 'No phone'}</div>
                  </div>
                  <Tag label="PRINCIPAL" color={C.accent} bg={C.accentGlow} />
                  <Btn onClick={() => setEditItem({...p, _type:'principal'})} variant="ghost" small>Edit</Btn>
                  <Btn onClick={() => { if(window.confirm('Remove principal?')) { supabase.from('profiles').delete().eq('id', p.id).then(loadAll) } }} variant="danger" small>Remove</Btn>
                </div>
              ))}
              {!principals.length && <div style={{ color: C.muted, fontSize: 13 }}>No principals yet.</div>}
            </div>
          </div>
        )}

        {/* ── TEACHERS TAB ── */}
        {tab === 'teachers' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Teachers</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Add individually or import multiple via CSV</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={() => setShowModal('teacher-import')} small variant="ghost">Import CSV</Btn>
                <Btn onClick={() => setShowModal('teacher')} small>+ Add Teacher</Btn>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teachers.map(t => (
                <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: C.purpleDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.purple, flexShrink: 0 }}>{t.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.email} {t.subject && `· ${t.subject}`}</div>
                  </div>
                  <Tag label="TEACHER" color={C.green} bg={C.greenDim} />
                  {t.is_class_teacher && <Tag label="CLASS TEACHER" color={C.yellow} bg={C.yellowDim} />}
                  <Btn onClick={() => setEditItem({...t, _type:'teacher'})} variant="ghost" small>Edit</Btn>
                  <Btn onClick={() => deleteTeacher(t.id)} variant="danger" small>Remove</Btn>
                </div>
              ))}
              {!teachers.length && <div style={{ color: C.muted, fontSize: 13 }}>No teachers yet.</div>}
            </div>
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === 'students' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Students</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Import auto-creates classes if they don't exist</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {classes.length > 0 && (
                  <Sel value={selClass?.id || ''} onChange={e => setSelClass(classes.find(c => c.id === e.target.value))} style={{ width: 100 }}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Sel>
                )}
                <Btn onClick={() => setShowModal('students')} small>+ Import Students</Btn>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {students.filter(s => s.class_id === selClass?.id).map(s => (
                <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, fontSize: 11, color: C.muted, fontWeight: 700 }}>#{s.roll_no}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</div>
                  <Btn onClick={() => setEditItem({...s, _type:'student'})} variant="ghost" small>Edit</Btn>
                  <button onClick={() => deleteStudent(s.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
              {selClass && !students.filter(s => s.class_id === selClass.id).length && (
                <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>No students in {selClass.name} yet. Use Import Students.</div>
              )}
              {!classes.length && <div style={{ color: C.muted, fontSize: 13 }}>Create classes first, or import students with class info and they'll be created automatically.</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: PRINCIPAL ── */}
      {showModal === 'principal' && (
        <Modal title="Add Principal" onClose={() => { setShowModal(null); setErr(''); setForm({ name: '', email: '', password: '', subject: '' }) }}>
          <Alert msg={err} />
          <Field label="Full Name"><Inp value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Kavita Sharma" /></Field>
          <Field label="Email"><Inp value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="principal@school.in" type="email" /></Field>
          <Field label="Password"><Inp value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" type="password" /></Field>
          <Btn onClick={() => createUser('principal')} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Create Principal</Btn>
        </Modal>
      )}

      {/* ── MODAL: TEACHER (single) ── */}
      {showModal === 'teacher' && (
        <Modal title="Add Teacher" onClose={() => { setShowModal(null); setErr(''); setForm({ name: '', email: '', password: '', subject: '', is_class_teacher: false }) }}>
          <Alert msg={err} />
          <Field label="Full Name"><Inp value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Priya Sharma" /></Field>
          <Field label="Email"><Inp value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="teacher@school.in" type="email" /></Field>
          <Field label="Password"><Inp value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" type="password" /></Field>
          <Field label="Subject (optional)"><Inp value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Mathematics" /></Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="ct-check" checked={form.is_class_teacher} onChange={e => setForm(p => ({ ...p, is_class_teacher: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.accent }} />
            <label htmlFor="ct-check" style={{ fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer' }}>Set as Class Teacher</label>
          </div>
          <Btn onClick={() => createUser('teacher')} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Create Teacher</Btn>
        </Modal>
      )}

      {/* ── MODAL: TEACHER CSV IMPORT ── */}
      {showModal === 'teacher-import' && (
        <Modal title="Import Teachers via CSV" onClose={() => { setShowModal(null); setErr('') }}>
          <Alert msg={err} />
          <div style={{ padding: '10px 14px', borderRadius: 8, background: C.accentGlow, border: `1px solid ${C.accent}30`, fontSize: 12, color: C.muted2, marginBottom: 14, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>CSV Format (one teacher per line):</strong><br />
            Name, Email, Password, Subject<br />
            <span style={{ color: C.muted }}>Example: Priya Sharma, priya@school.in, pass1234, Mathematics</span>
          </div>
          <Field label="Paste CSV data">
            <textarea value={teacherCsvText} onChange={e => setTeacherCsvText(e.target.value)}
              placeholder={'Priya Sharma, priya@school.in, pass1234, Mathematics\nRahul Gupta, rahul@school.in, pass1234, Physics'}
              style={{ width: '100%', height: 180, padding: '10px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
          </Field>
          <Btn onClick={importTeachersCSV} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>
            Import Teachers
          </Btn>
        </Modal>
      )}

      {/* ── MODAL: BATCH CLASSES ── */}
      {showModal === 'class' && (
        <Modal title="Add Classes" onClose={() => { setShowModal(null); setErr('') }}>
          <Alert msg={err} />
          <div style={{ fontSize: 13, color: C.muted2, marginBottom: 14 }}>Add multiple classes at once. Click + to add more rows.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {batchClasses.map((bc, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <Sel value={bc.grade} onChange={e => setBatchClasses(p => p.map((x,j) => j===i ? {...x,grade:e.target.value} : x))}>
                  {['1','2','3','4','5','6','7','8','9','10','11','12'].map(g => <option key={g}>{g}</option>)}
                </Sel>
                <Sel value={bc.section} onChange={e => setBatchClasses(p => p.map((x,j) => j===i ? {...x,section:e.target.value} : x))}>
                  {['A','B','C','D','E','F'].map(s => <option key={s}>{s}</option>)}
                </Sel>
                <button onClick={() => setBatchClasses(p => p.filter((_,j) => j!==i))} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>
          <Btn onClick={() => setBatchClasses(p => [...p, { grade: '10', section: 'A' }])} variant="ghost" small style={{ marginBottom: 16 }}>+ Add Another Class</Btn>
          <Btn onClick={createBatchClasses} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>
            Create {batchClasses.length} Class{batchClasses.length > 1 ? 'es' : ''}
          </Btn>
        </Modal>
      )}

      {/* ── MODAL: EDIT PRINCIPAL ── */}
      {editItem?._type === 'principal' && (
        <Modal title="Edit Principal" onClose={() => { setEditItem(null); setErr('') }}>
          <Alert msg={err} />
          <Field label="Full Name"><Inp value={editItem.name} onChange={e => setEditItem(p => ({...p, name: e.target.value}))} placeholder="Principal Name" /></Field>
          <Field label="Email"><Inp value={editItem.email} disabled /></Field>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Email cannot be changed directly.</div>
          <Field label="Phone"><Inp value={editItem.phone || ''} onChange={e => setEditItem(p => ({...p, phone: e.target.value}))} placeholder="+91..." /></Field>
          <Btn onClick={() => updateProfile(editItem.id, { name: editItem.name, phone: editItem.phone })} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Save Changes</Btn>
        </Modal>
      )}

      {/* ── MODAL: EDIT TEACHER ── */}
      {editItem?._type === 'teacher' && (
        <Modal title="Edit Teacher" onClose={() => { setEditItem(null); setErr('') }}>
          <Alert msg={err} />
          <Field label="Full Name"><Inp value={editItem.name} onChange={e => setEditItem(p => ({...p, name: e.target.value}))} placeholder="Teacher Name" /></Field>
          <Field label="Email"><Inp value={editItem.email} disabled /></Field>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Email cannot be changed directly.</div>
          <Field label="Phone"><Inp value={editItem.phone || ''} onChange={e => setEditItem(p => ({...p, phone: e.target.value}))} placeholder="+91..." /></Field>
          <Field label="Subject"><Inp value={editItem.subject || ''} onChange={e => setEditItem(p => ({...p, subject: e.target.value}))} placeholder="Math..." /></Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="ct-edit" checked={!!editItem.is_class_teacher} onChange={e => setEditItem(p => ({ ...p, is_class_teacher: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.accent }} />
            <label htmlFor="ct-edit" style={{ fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer' }}>Set as Class Teacher</label>
          </div>
          <Btn onClick={() => updateProfile(editItem.id, { name: editItem.name, phone: editItem.phone, subject: editItem.subject, is_class_teacher: editItem.is_class_teacher })} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Save Changes</Btn>
        </Modal>
      )}

      {/* ── MODAL: EDIT STUDENT ── */}
      {editItem?._type === 'student' && (
        <Modal title="Edit Student" onClose={() => { setEditItem(null); setErr('') }}>
          <Alert msg={err} />
          <Field label="Full Name"><Inp value={editItem.name} onChange={e => setEditItem(p => ({...p, name: e.target.value}))} placeholder="Student Name" /></Field>
          <Field label="Roll Number"><Inp value={editItem.roll_no} onChange={e => setEditItem(p => ({...p, roll_no: e.target.value}))} placeholder="01" /></Field>
          <Field label="Class">
            <Sel value={editItem.class_id} onChange={e => setEditItem(p => ({...p, class_id: e.target.value}))}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
          </Field>
          <Btn onClick={() => updateStudent(editItem.id, { name: editItem.name, roll_no: editItem.roll_no, class_id: editItem.class_id })} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Save Changes</Btn>
        </Modal>
      )}

      {/* ── MODAL: STUDENTS IMPORT ── */}
      {showModal === 'students' && (
        <Modal title="Import Students" onClose={() => { setShowModal(null); setErr('') }}>
          <Alert msg={err} />
          <div style={{ padding: '10px 14px', borderRadius: 8, background: C.accentGlow, border: `1px solid ${C.accent}30`, fontSize: 12, color: C.muted2, marginBottom: 14, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>CSV Format (one student per line):</strong><br />
            Name, Roll No, Class, Section<br />
            <span style={{ color: C.muted }}>Example: Arjun Sharma, 01, 10, A</span><br />
            <span style={{ color: C.green }}>Classes are auto-created if they don't exist!</span>
          </div>
          {classes.length > 0 && (
            <Field label="Default Class (if no class column)">
              <Sel value={selClass?.id || ''} onChange={e => setSelClass(classes.find(c => c.id === e.target.value))}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Sel>
            </Field>
          )}
          <Field label="Paste CSV data">
            <textarea value={studentCsvText} onChange={e => setStudentCsvText(e.target.value)}
              placeholder={'Arjun Sharma, 01, 10, A\nPriya Singh, 02, 10, A\nRahul Gupta, 01, 10, B\nSneha Patel, 02, 11, A'}
              style={{ width: '100%', height: 200, padding: '10px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
          </Field>
          <Btn onClick={importStudentsCSV} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>Import Students</Btn>
        </Modal>
      )}
    </>
  )
}

// ─── TEACHER PORTAL ───────────────────────────────────────────
const TeacherPortal = ({ profile, school }) => {
  const [tab, setTab] = useState('take')
  const [myClasses, setMyClasses] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selClass, setSelClass] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [session, setSession] = useState({})
  const [mode, setMode] = useState(null)
  const [curIdx, setCurIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ai, setAi] = useState({ loading: false, text: '' })

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { if (selClass) loadStudents() }, [selClass])
  useEffect(() => { if (selClass) loadAttendance() }, [selClass, date])
  useEffect(() => { if (myClasses.length && !selClass) setSelClass(myClasses[0]) }, [myClasses])

  const loadClasses = async () => {
    const { data } = await supabase.from('teacher_classes').select('*, classes(*)').eq('teacher_id', profile.id)
    setMyClasses((data || []).map(tc => ({ ...tc.classes, subject: tc.subject })))
    setLoading(false)
  }

  const loadStudents = async () => {
    if (!selClass) return
    const { data } = await supabase.from('students').select('*').eq('class_id', selClass.id).order('roll_no')
    setStudents(data || [])
  }

  const loadAttendance = async () => {
    if (!selClass) return
    const { data } = await supabase.from('attendance').select('*').eq('class_id', selClass.id).eq('date', date)
    setAttendance(data || [])
  }

  const initSession = () => {
    const s = {}
    students.forEach(st => { s[st.id] = attendance.find(a => a.student_id === st.id)?.status || 'P' })
    setSession(s); setCurIdx(0); setSaved(false)
  }

  const mark = (sid, val) => {
    setSession(p => ({ ...p, [sid]: val }))
    if (mode === 'sequential' && curIdx < students.length - 1) setTimeout(() => setCurIdx(i => i + 1), 280)
  }

  const saveAttendance = async () => {
    setSaving(true)
    const rows = students.map(s => ({ school_id: school.id, student_id: s.id, class_id: selClass.id, date, status: session[s.id] || 'P', marked_by: profile.id }))
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
    setSaving(false)
    if (!error) { setSaved(true); loadAttendance() }
  }

  const getAiAnalysis = async () => {
    setAi({ loading: true, text: '' })
    const { data: hist } = await supabase.from('attendance').select('*, students(name)').eq('class_id', selClass?.id).order('date', { ascending: false }).limit(students.length * 20)
    const grouped = {}
    hist?.forEach(r => {
      grouped[r.student_id] = grouped[r.student_id] || { name: r.students?.name, p: 0, a: 0, l: 0 }
      if (r.status === 'P') grouped[r.student_id].p++
      else if (r.status === 'A') grouped[r.student_id].a++
      else grouped[r.student_id].l++
    })
    const atRisk = Object.values(grouped).filter(s => { const t = s.p+s.a+s.l; return t > 0 && (s.p/t) < 0.75 }).map(s => `${s.name} (${Math.round(s.p/(s.p+s.a+s.l)*100)}%)`)
    const prompt = `CatalystBox AI Teacher Report - Class ${selClass?.name}, ${school?.name}.
At-risk students: ${atRisk.join(', ') || 'None'}
Today: ${Object.values(session).filter(v=>v==='P').length} present, ${Object.values(session).filter(v=>v==='A').length} absent
Give a 3-point action plan. 120 words max.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
      })
      const d = await res.json()
      setAi({ loading: false, text: d.content[0].text })
    } catch { setAi({ loading: false, text: 'Could not connect to AI.' }) }
  }

  const todayDone = attendance.length === students.length && students.length > 0
  const stats = { p: Object.values(session).filter(v=>v==='P').length, a: Object.values(session).filter(v=>v==='A').length, l: Object.values(session).filter(v=>v==='L').length }
  const TABS = [{ id: 'take', label: 'Take Attendance' }, { id: 'reports', label: 'Reports' }]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>

  if (!myClasses.length) return (
    <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No classes assigned</div>
      <div style={{ fontSize: 13 }}>Contact your school admin to get classes assigned.</div>
    </div>
  )

  return (
    <>
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2, paddingTop: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 15px', borderRadius: '6px 6px 0 0',
              border: `1px solid ${tab === t.id ? C.border : 'transparent'}`,
              borderBottom: tab === t.id ? `1px solid ${C.card}` : 'none',
              background: tab === t.id ? C.card : 'transparent',
              color: tab === t.id ? C.text : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'take' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Take Attendance</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Select class and date, then mark students</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sel value={selClass?.id || ''} onChange={e => { setSelClass(myClasses.find(c => c.id === e.target.value)); setMode(null); setSession({}); setSaved(false) }} style={{ width: 90 }}>
                  {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Sel>
                <Inp type="date" value={date} onChange={e => { setDate(e.target.value); setMode(null); setSession({}); setSaved(false) }} style={{ width: 150 }} />
              </div>
            </div>
            {!mode ? (
              <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{todayDone ? '✅' : '📋'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  {todayDone ? `Attendance saved for ${date}` : `${students.length} students in ${selClass?.name}`}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
                  {todayDone ? 'You can edit existing records' : `Ready to mark for ${date}`}
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Btn onClick={() => { initSession(); setMode('sequential') }}>{todayDone ? 'Edit One by One' : 'One by One'}</Btn>
                  <Btn onClick={() => { initSession(); setMode('grid') }} variant="ghost">{todayDone ? 'Edit Grid' : 'Grid View'}</Btn>
                </div>
              </Card>
            ) : saved ? (
              <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 6 }}>Attendance Saved!</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{stats.p} Present · {stats.a} Absent · {stats.l} Late</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Btn onClick={() => { initSession(); setMode('grid') }} variant="ghost">Edit Records</Btn>
                  <Btn onClick={getAiAnalysis} loading={ai.loading}>Get AI Report</Btn>
                </div>
                {ai.text && (
                  <div style={{ marginTop: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>AI REPORT</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{ai.text}</div>
                  </div>
                )}
              </Card>
            ) : mode === 'sequential' ? (
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                  {students.map((s, i) => (
                    <div key={s.id} onClick={() => setCurIdx(i)} style={{
                      width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
                      border: `2px solid ${i === curIdx ? C.accent : session[s.id] ? statusColor(session[s.id])+'50' : C.border}`,
                      background: i === curIdx ? C.accentGlow : session[s.id] ? statusBg(session[s.id]) : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: i === curIdx ? C.accent : session[s.id] ? statusColor(session[s.id]) : C.muted,
                    }}>{s.roll_no}</div>
                  ))}
                </div>
                {students[curIdx] && (
                  <Card style={{ textAlign: 'center', padding: '36px 24px' }} key={curIdx}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>{curIdx + 1} / {students.length}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 4 }}>{students[curIdx].name}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 30 }}>Roll #{students[curIdx].roll_no} · {selClass?.name}</div>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                      {[['P','Present',C.green,C.greenDim],['A','Absent',C.red,C.redDim],['L','Late',C.yellow,C.yellowDim]].map(([val,lbl,col,bg]) => (
                        <button key={val} onClick={() => mark(students[curIdx].id, val)} style={{
                          width: 88, height: 78, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                          border: `2px solid ${session[students[curIdx].id]===val ? col : col+'30'}`,
                          background: session[students[curIdx].id]===val ? bg : 'transparent',
                          color: col, transition: 'all .15s',
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 900 }}>{val}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{lbl}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 22 }}>
                      <Btn onClick={() => setCurIdx(i => Math.max(0,i-1))} variant="ghost" small disabled={curIdx===0}>Prev</Btn>
                      {curIdx === students.length - 1
                        ? <Btn onClick={saveAttendance} loading={saving} variant="success">Save All</Btn>
                        : <Btn onClick={() => setCurIdx(i => i+1)} small>Next</Btn>}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <Btn onClick={saveAttendance} loading={saving} variant="success" small>Save Attendance</Btn>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8 }}>
                  {students.map(s => (
                    <div key={s.id} style={{ background: C.card, border: `1px solid ${statusColor(session[s.id]||'P')}25`, borderRadius: 9, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.name}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>#{s.roll_no}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['P','A','L'].map(v => (
                          <button key={v} onClick={() => setSession(p => ({...p,[s.id]:v}))} style={{
                            flex: 1, padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                            border: `1.5px solid ${session[s.id]===v ? statusColor(v) : statusColor(v)+'25'}`,
                            background: session[s.id]===v ? statusBg(v) : 'transparent',
                            color: statusColor(v), fontSize: 11, fontWeight: 800,
                          }}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'reports' && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Class Reports</div>
              <Sel value={selClass?.id || ''} onChange={e => setSelClass(myClasses.find(c => c.id === e.target.value))} style={{ width: 100 }}>
                {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Sel>
            </div>
            <ReportsView classId={selClass?.id} schoolId={school.id} students={students} />
          </div>
        )}
      </div>
    </>
  )
}

const ReportsView = ({ classId, schoolId, students }) => {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('student_attendance_summary').select('*').eq('class_id', classId).eq('school_id', schoolId)
      setSummaries(data || [])
      setLoading(false)
    }
    load()
  }, [classId])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>

  const avgPct = summaries.length ? Math.round(summaries.reduce((a,s) => a+(s.attendance_pct||0),0)/summaries.length) : 0

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <Stat value={`${avgPct}%`} label="Class Average" color={avgPct>=85?C.green:C.yellow} />
        <Stat value={students.length} label="Students" color={C.accent} />
        <Stat value={summaries.filter(s=>(s.attendance_pct||0)<75).length} label="At Risk" color={C.red} />
        <Stat value={summaries.filter(s=>(s.attendance_pct||0)>=90).length} label="Excellent" color={C.green} />
      </div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Student Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {summaries.sort((a,b)=>(a.attendance_pct||0)-(b.attendance_pct||0)).map(s => (
            <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: (s.attendance_pct||0)<75?C.redDim:'transparent', border: `1px solid ${(s.attendance_pct||0)<75?C.red+'25':C.border}` }}>
              <div style={{ width: 22, fontSize: 11, color: C.muted, fontWeight: 700 }}>{s.roll_no}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Tag label={`P:${s.present_count}`} color={C.green} bg={C.greenDim} />
                <Tag label={`A:${s.absent_count}`} color={C.red} bg={C.redDim} />
                <Tag label={`L:${s.late_count}`} color={C.yellow} bg={C.yellowDim} />
              </div>
              <div style={{ width: 90 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: (s.attendance_pct||0)>=85?C.green:(s.attendance_pct||0)>=75?C.yellow:C.red }}>{s.attendance_pct||0}%</span>
                </div>
                <PctBar value={s.attendance_pct||0} />
              </div>
              {(s.attendance_pct||0) < 75 && <Tag label="Risk" color={C.red} bg={C.redDim} />}
            </div>
          ))}
          {!summaries.length && <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No data yet.</div>}
        </div>
      </Card>
    </>
  )
}

// ─── PRINCIPAL PORTAL ─────────────────────────────────────────
const PrincipalPortal = ({ profile, school }) => {
  const [tab, setTab] = useState('overview')
  const [classes, setClasses] = useState([])
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [ai, setAi] = useState({ loading: false, text: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [cls, sum] = await Promise.all([
      supabase.from('classes').select('*').eq('school_id', school.id).order('name'),
      supabase.from('student_attendance_summary').select('*').eq('school_id', school.id),
    ])
    setClasses(cls.data || [])
    setSummaries(sum.data || [])
    setLoading(false)
  }

  const classStats = classes.map(c => {
    const cS = summaries.filter(s => s.class_id === c.id)
    const avg = cS.length ? Math.round(cS.reduce((a,s)=>a+(s.attendance_pct||0),0)/cS.length) : 0
    return { ...c, avg, atRisk: cS.filter(s=>(s.attendance_pct||0)<75).length, count: cS.length }
  })

  const schoolAvg = summaries.length ? Math.round(summaries.reduce((a,s)=>a+(s.attendance_pct||0),0)/summaries.length) : 0
  const totalAtRisk = summaries.filter(s=>(s.attendance_pct||0)<75).length

  const getAiReport = async () => {
    setAi({ loading: true, text: '' })
    const prompt = `CatalystBox Principal Report - ${school.name}
School average: ${schoolAvg}%, At-risk: ${totalAtRisk}
${classStats.map(c=>`${c.name}: ${c.avg}% avg, ${c.atRisk} at-risk`).join('\n')}
200-word report: school health, concerns, top performers, one recommendation.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
      })
      const d = await res.json()
      setAi({ loading: false, text: d.content[0].text })
    } catch { setAi({ loading: false, text: 'Could not connect to AI.' }) }
  }

  const TABS = [{ id: 'overview', label: 'Overview' }, { id: 'atrisk', label: `At-Risk (${totalAtRisk})` }, { id: 'report', label: 'AI Report' }]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>

  return (
    <>
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2, paddingTop: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 15px', borderRadius: '6px 6px 0 0',
              border: `1px solid ${tab === t.id ? C.border : 'transparent'}`,
              borderBottom: tab === t.id ? `1px solid ${C.card}` : 'none',
              background: tab === t.id ? C.card : 'transparent',
              color: tab === t.id ? C.text : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'overview' && (
          <div className="fade-up">
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>School Overview — {school.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              <Stat value={`${schoolAvg}%`} label="School Average" color={schoolAvg>=85?C.green:C.yellow} />
              <Stat value={summaries.length} label="Total Students" color={C.accent} />
              <Stat value={totalAtRisk} label="At-Risk" color={C.red} />
              <Stat value={classes.length} label="Classes" color={C.purple} />
            </div>
            {classes.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏫</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>School setup in progress</div>
                <div style={{ fontSize: 13, color: C.muted }}>The admin is setting up classes and students. Check back soon.</div>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                {classStats.map(c => (
                  <div key={c.id} style={{ background: C.card, border: `1px solid ${c.avg<75?C.red+'40':C.border}`, borderRadius: 10, padding: '16px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{c.name}</div>
                      <span style={{ fontSize: 18, fontWeight: 900, color: c.avg>=85?C.green:c.avg>=75?C.yellow:C.red }}>{c.avg}%</span>
                    </div>
                    <PctBar value={c.avg} />
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{c.count} students</span>
                      {c.atRisk > 0 && <Tag label={`${c.atRisk} at risk`} color={C.red} bg={C.redDim} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'atrisk' && (
          <div className="fade-up">
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>At-Risk Students</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summaries.filter(s=>(s.attendance_pct||0)<75).sort((a,b)=>(a.attendance_pct||0)-(b.attendance_pct||0)).map(s => {
                const cls = classes.find(c=>c.id===s.class_id)
                return (
                  <div key={s.student_id} style={{ background: C.card, border: `1px solid ${C.red}25`, borderRadius: 10, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: C.red }}>{s.attendance_pct}%</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>Class {cls?.name} · Roll #{s.roll_no}</div>
                    </div>
                    <Tag label={`${s.present_count}P`} color={C.green} bg={C.greenDim} />
                    <Tag label={`${s.absent_count}A`} color={C.red} bg={C.redDim} />
                  </div>
                )
              })}
              {totalAtRisk === 0 && <div style={{ textAlign: 'center', padding: 60, color: C.green }}>No at-risk students. All above 75%.</div>}
            </div>
          </div>
        )}
        {tab === 'report' && (
          <div className="fade-up">
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>AI School Report</div>
            <Card style={{ marginBottom: 16 }}>
              <Btn onClick={getAiReport} loading={ai.loading}>Generate Report</Btn>
            </Card>
            {ai.text && (
              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  PRINCIPAL REPORT · {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{ai.text}</div>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── SETTINGS PORTAL ──────────────────────────────────────────
const SettingsPortal = ({ profile, onUpdated }) => {
  const [form, setForm] = useState({ name: profile.name || '', phone: profile.phone || '', subject: profile.subject || '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    setSaving(true); setMsg('')
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    if (error) { setMsg('Error: ' + error.message) }
    else { setMsg('Profile updated securely!'); onUpdated() }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }} className="fade-up">
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 20 }}>Account Settings</div>
      <Card>
        <Alert msg={msg} type={msg.startsWith('Error') ? 'error' : 'success'} />
        <Field label="Full Name"><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></Field>
        <Field label="Email Address"><Inp value={profile.email} disabled /></Field>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Email cannot be changed directly via settings.</div>
        <Field label="Phone Number"><Inp value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></Field>
        {profile.role === 'teacher' && <Field label="Subject"><Inp value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} /></Field>}
        <Btn onClick={save} loading={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>Save Profile Settings</Btn>
      </Card>
    </div>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [school, setSchool] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [appTab, setAppTab] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (_blockAuthChange) return  // ignore while creating users
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setSchool(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    setProfileLoading(true)
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(prof || null)
    if (prof?.school_id) {
      const { data: sch } = await supabase.from('schools').select('*').eq('id', prof.school_id).single()
      setSchool(sch)
    }
    setProfileLoading(false)
  }

  const handleLogout = () => supabase.auth.signOut()

  if (session === undefined || profileLoading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{GS}</style>
      <Spinner size={32} />
    </div>
  )

  if (!session) return <AuthScreen />

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{GS}</style>
      <div style={{ textAlign: 'center', color: C.muted }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Profile not found</div>
        <div style={{ fontSize: 13, marginBottom: 20 }}>Your account exists but has no profile. Contact your administrator.</div>
        <Btn onClick={handleLogout} variant="ghost">Sign Out</Btn>
      </div>
    </div>
  )

  if (profile.role !== 'superadmin' && !school) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{GS}</style>
      <Spinner size={32} />
    </div>
  )

  const roleTabMap = {
    superadmin: [{ id: 'dashboard', label: 'Super Admin' }, { id: 'settings', label: 'Settings' }],
    admin: [{ id: 'dashboard', label: 'School Admin' }, { id: 'settings', label: 'Settings' }],
    principal: [{ id: 'dashboard', label: 'Principal Dashboard' }, { id: 'settings', label: 'Settings' }],
    teacher: [{ id: 'dashboard', label: 'My Classes' }, { id: 'settings', label: 'Settings' }],
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', background: C.bg }}>
      <style>{GS}</style>
      <TopNav profile={profile} school={school} onLogout={handleLogout} tab={appTab} setTab={setAppTab} tabs={roleTabMap[profile.role] || []} />
      {appTab === 'settings' ? (
        <SettingsPortal profile={profile} onUpdated={() => loadProfile(profile.id)} />
      ) : (
        <>
          {profile.role === 'superadmin' && <SuperAdminPortal profile={profile} />}
          {profile.role === 'admin' && <AdminPortal profile={profile} school={school} />}
          {profile.role === 'principal' && <PrincipalPortal profile={profile} school={school} />}
          {profile.role === 'teacher' && <TeacherPortal profile={profile} school={school} />}
        </>
      )}
    </div>
  )
}

