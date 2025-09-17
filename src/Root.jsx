import React from 'react'
import Protected from './auth/Protected'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { supabase } from './lib/supabase'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'

function Header({ view, setView }) {
  const { user } = useAuth()

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      // Nie trzeba reload — AuthProvider wykryje brak sesji
      // i Protected pokaże ekran logowania.
    } catch (e) {
      console.error('Sign out error', e)
    }
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      padding: 8,
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      zIndex: 10
    }}>
      <button className="btn" onClick={() => setView('app')}>Aplikacja</button>
      <button className="btn" onClick={() => setView('admin')}>Admin</button>
      <span className="muted" style={{ marginLeft: 'auto' }}>
        {user?.email || 'Zalogowano'}
      </span>
      <button className="btn" onClick={handleSignOut} aria-label="Wyloguj">
        Wyloguj
      </button>
    </div>
  )
}

export default function Root() {
  const [view, setView] = React.useState('app')
  return (
    <AuthProvider>
      <Protected>
        <Header view={view} setView={setView} />
        {view === 'admin' ? <Admin /> : <App />}
      </Protected>
    </AuthProvider>
  )
}
