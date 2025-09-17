
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)

  async function signIn(e){
    e.preventDefault()
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : null)
  }

  return (
    <div style={{maxWidth:380, margin:'64px auto'}} className="card">
      <div className="body">
        <h2>Logowanie</h2>
        <form onSubmit={signIn} style={{display:'grid', gap:12}}>
          <label> Email
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <label> Hasło
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </label>
          {message && <div className="muted">{message}</div>}
          <button className="btn" type="submit">Zaloguj</button>
        </form>
      </div>
    </div>
  )
}
