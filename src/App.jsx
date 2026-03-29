import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import BoardDashboard from './pages/BoardDashboard'
import SchoolDashboard from './pages/SchoolDashboard'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [schoolCode, setSchoolCode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserRole(session.user.email)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUserRole(session.user.email)
      else { setUserRole(null); setSchoolCode(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserRole(email) {
    const { data, error } = await supabase
      .from('dashboard_users')
      .select('role, school_code')
      .eq('email', email)
      .single()
    
    if (data) {
      setUserRole(data.role)
      setSchoolCode(data.school_code)
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--teal)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18 }}>CatalystBox</p>
      </div>
    </div>
  )

  if (!session) return <Login />

  if (userRole === 'board') return <BoardDashboard onSignOut={() => supabase.auth.signOut()} />
  if (userRole === 'school' || userRole === 'admin' || userRole === 'principal') return <SchoolDashboard schoolCode={schoolCode} onSignOut={() => supabase.auth.signOut()} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Account not configured. Contact your administrator.</p>
    </div>
  )
}


