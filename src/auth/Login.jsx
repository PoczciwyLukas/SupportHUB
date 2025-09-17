import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [mode, setMode] = useState('password')

  async function signIn(e){
    e.preventDefault()
    setMessage(null)
    if(mode === 'password'){
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) setMessage(error.message)
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      setMessage(error ? error.message : 'Sprawdź skrzynkę – wysłaliśmy link.')
    }
  }

  return (
    <div style={{maxWidth: 380, margin: '64px auto'}} className="card">
      <div className="body">
        <h2>Logowanie</h2>
        <p className="muted">Zaloguj się aby przejść do SupportHUB.</p>

        <form onSubmit={signIn} style={{display:'grid', gap:12}}>
          <label>
            <div>Email</div>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>

          {mode === 'password' && (
            <label>
              <div>Hasło</div>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </label>
          )}

          {message && <div className="muted">{message}</div>}

          <button className="btn" type="submit">{mode === 'password' ? 'Zaloguj' : 'Wyślij link'}</button>
          <button type="button" className="btn" onClick={()=>setMode(mode==='password'?'magic':'password')}>
            {mode==='password' ? 'Logowanie linkiem e‑mail' : 'Mam hasło'}
          </button>
        </form>
      </div>
    </div>
  )
}