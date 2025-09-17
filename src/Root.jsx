
import React from 'react'
import Protected from './auth/Protected'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { OrgProvider, useOrg } from './org/OrgProvider'
import { supabase } from './lib/supabase'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'

function Header({ view, setView }){
  const { user } = useAuth()
  const { orgs, currentOrg, selectOrg, role } = useOrg()

  async function handleSignOut(){ try{ await supabase.auth.signOut() }catch(e){ console.error(e)} }

  return (
    <div style={{position:'sticky', top:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:8, display:'flex', gap:8, alignItems:'center', zIndex:10}}>
      <button className="btn" onClick={()=>setView('app')}>Aplikacja</button>
      <button className="btn" onClick={()=>setView('admin')}>Admin</button>

      <div style={{marginLeft:16, display:'flex', alignItems:'center', gap:8}}>
        <span className="muted">Firma:</span>
        <select className="input" value={currentOrg?.id || ''} onChange={e=>selectOrg(e.target.value)}>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="muted">Rola: {role}</span>
      </div>

      <span className="muted" style={{marginLeft:'auto'}}>{user?.email || 'Zalogowano'}</span>
      <button className="btn" onClick={handleSignOut}>Wyloguj</button>
    </div>
  )
}

export default function Root(){
  const [view, setView] = React.useState('app')
  return (
    <AuthProvider>
      <Protected>
        <OrgProvider>
          <Header view={view} setView={setView} />
          {view==='admin' ? <Admin/> : <App/>}
        </OrgProvider>
      </Protected>
    </AuthProvider>
  )
}
