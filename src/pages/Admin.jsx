
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useOrg } from '../org/OrgProvider'

export default function Admin(){
  const [orgs, setOrgs] = useState([])
  const [name, setName] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('viewer')
  const [msg, setMsg] = useState(null)

  const { selectOrg } = useOrg()

  async function loadOrgs(){
    const { data, error } = await supabase.from('orgs').select('*').order('created_at', { ascending: false })
    if(!error) setOrgs(data || [])
  }
  async function loadMembers(org_id){
    if(!org_id){ setMembers([]); return }
    const { data, error } = await supabase.from('org_members').select('org_id, user_id, role, added_at').eq('org_id', org_id)
    if(!error) setMembers(data || [])
  }
  useEffect(()=>{ loadOrgs() }, [])
  useEffect(()=>{ loadMembers(selectedOrg) }, [selectedOrg])

  async function addOrg(){
    setMsg(null)
    if(!name.trim()) return
    const { error } = await supabase.from('orgs').insert({ name })
    if(error){ setMsg(error.message); return }
    setName(''); await loadOrgs()
  }

  async function createUserAndAssign(){
    setMsg(null)
    if(!selectedOrg) { setMsg('Wybierz firmę.'); return }
    if(!email || !password){ setMsg('Podaj e‑mail i hasło.'); return }
    const { data, error } = await supabase.functions.invoke('admin_create_user', {
      body: { org_id: selectedOrg, email, full_name: fullName, password, role }
    })
    if(error){ setMsg(error.message); return }
    setEmail(''); setFullName(''); setPassword(''); setRole('viewer')
    await loadMembers(selectedOrg)
    setMsg('Utworzono użytkownika i przypisano do firmy.')
  }

  async function upsertMemberByEmail(){
    setMsg(null)
    if(!selectedOrg || !email){ setMsg('Wybierz firmę i podaj e‑mail.'); return }
    const { data, error } = await supabase.functions.invoke('admin_upsert_member', {
      body: { org_id: selectedOrg, email, role }
    })
    if(error){ setMsg(error.message); return }
    await loadMembers(selectedOrg)
    setMsg('Zaktualizowano rolę użytkownika w firmie.')
  }

  return (
    <div className="card" style={{maxWidth: 1000, margin: '24px auto'}}>
      <div className="body" style={{display:'grid', gap:24}}>
        <h2>Administracja</h2>
        {msg && <div className="muted">{msg}</div>}

        <section>
          <h3>Firmy</h3>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <input className="input" placeholder="Nazwa firmy" value={name} onChange={e=>setName(e.target.value)} />
            <button className="btn" onClick={addOrg}>Dodaj firmę</button>
            <span className="muted">/</span>
            <select className="input" value={selectedOrg} onChange={e=>{ setSelectedOrg(e.target.value); selectOrg(e.target.value) }}>
              <option value="">— wybierz —</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <ul>
            {orgs.map(o => (
              <li key={o.id}><strong>{o.name}</strong> <span className="muted">({new Date(o.created_at).toLocaleString()})</span></li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Użytkownicy w wybranej firmie</h3>
          {!selectedOrg && <p className="muted">Wybierz firmę.</p>}
          {selectedOrg && (
            <div style={{display:'grid', gap:12}}>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                <input className="input" placeholder="Imię i nazwisko (opcjonalnie)" value={fullName} onChange={e=>setFullName(e.target.value)} />
                <input className="input" placeholder="Hasło (min. 8 znaków)" value={password} onChange={e=>setPassword(e.target.value)} />
                <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="viewer">viewer</option>
                  <option value="operator">operator</option>
                  <option value="admin">admin</option>
                </select>
                <button className="btn" onClick={createUserAndAssign}>Utwórz użytkownika i przypisz</button>
                <button className="btn" onClick={upsertMemberByEmail}>Przypisz / zmień rolę istniejącego</button>
              </div>
              <table style={{width:'100%'}}>
                <thead><tr><th>User ID</th><th>Rola</th><th>Dodano</th></tr></thead>
                <tbody>
                  {members.map((m,i)=> <tr key={i}><td>{m.user_id}</td><td>{m.role}</td><td>{new Date(m.added_at).toLocaleString()}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
