import React from 'react'
import Protected from './auth/Protected'
import { AuthProvider } from './auth/AuthProvider'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'

export default function Root(){
  const [view, setView] = React.useState('app')
  return (
    <AuthProvider>
      <Protected>
        <div style={{position:'sticky', top:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:8, display:'flex', gap:8, zIndex:10}}>
          <button className="btn" onClick={()=>setView('app')}>Aplikacja</button>
          <button className="btn" onClick={()=>setView('admin')}>Admin</button>
          <span className="muted" style={{marginLeft:'auto'}}>Zalogowano</span>
        </div>
        {view==='admin' ? <Admin/> : <App/>}
      </Protected>
    </AuthProvider>
  )
}