import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin(){
  const [orgs, setOrgs] = useState([])
  const [name, setName] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [members, setMembers] = useState([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('viewer')

  async function loadOrgs(){
    const { data, error } = await supabase.from('orgs').select('*').order('created_at', { ascending: false })
    if(!error) setOrgs(data || [])
  }
  async function loadMembers(org_id){
    if(!org_id){ setMembers([]); return }
    const { data, error } = await supabase.from('org_members').select('*').eq('org_id', org_id)
    if(!error) setMembers(data || [])
  }
  useEffect(()=>{ loadOrgs() }, [])
  useEffect(()=>{ loadMembers(selectedOrg) }, [selectedOrg])

  async function addOrg(){
    if(!name.trim()) return
    const { error } = await supabase.from('orgs').insert({ name })
    if(!error){ setName(''); loadOrgs() }
  }

  async function addMember(){
    if(!selectedOrg || !memberEmail) return
    // Uwaga: dodanie usera do Supabase (Auth) robisz w panelu Supabase → Auth → Invite user
    // Tutaj przypisujemy istniejącego usera do firmy: znajdź user_id po adresie email
    const { data: allUsers, error: listErr } = await supabase.auth.admin.listUsers() // zadziała lokalnie; w produkcji zalecane Edge Functions
    if(listErr){ alert('Najpierw zaproś użytkownika w Supabase (Auth → Invite user), a tu tylko przypisz rolę.'); return }
    const user = (allUsers?.users || []).find(u => (u.email||'').toLowerCase() === memberEmail.toLowerCase())
    if(!user){ alert('Nie znaleziono użytkownika. Użyj w Supabase → Auth → Invite user.'); return }
    const { error } = await supabase.from('org_members').insert({ org_id: selectedOrg, user_id: user.id, role: memberRole })
    if(!error){ setMemberEmail(''); loadMembers(selectedOrg) }
  }

  return (
    <div className="card" style={{maxWidth: 960, margin: '24px auto'}}>
      <div className="body" style={{display:'grid', gap:24}}>
        <h2>Administracja</h2>

        <section>
          <h3>Firmy</h3>
          <div style={{display:'flex', gap:8}}>
            <input className="input" placeholder="Nazwa firmy" value={name} onChange={e=>setName(e.target.value)} />
            <button className="btn" onClick={addOrg}>Dodaj firmę</button>
          </div>
          <ul>
            {orgs.map(o => (
              <li key={o.id}>
                <label style={{display:'flex', gap:8, alignItems:'center'}}>
                  <input type="radio" name="org" value={o.id} onChange={()=>setSelectedOrg(o.id)} checked={selectedOrg===o.id} />
                  <strong>{o.name}</strong> <span className="muted">({new Date(o.created_at).toLocaleString()})</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Członkowie wybranej firmy</h3>
          {!selectedOrg && <p className="muted">Wybierz firmę powyżej.</p>}
          {selectedOrg && (
            <div style={{display:'grid', gap:12}}>
              <div style={{display:'flex', gap:8}}>
                <input className="input" placeholder="Email użytkownika (zaproszony w Supabase)" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} />
                <select className="input" value={memberRole} onChange={e=>setMemberRole(e.target.value)}>
                  <option value="viewer">viewer (podgląd)</option>
                  <option value="operator">operator (edycja)</option>
                  <option value="admin">admin (pełny dostęp)</option>
                </select>
                <button className="btn" onClick={addMember}>Dodaj do firmy</button>
              </div>
              <table style={{width:'100%'}}>
                <thead>
                  <tr><th>User ID</th><th>Rola</th><th>Dodano</th></tr>
                </thead>
                <tbody>
                  {members.map((m,i)=> (
                    <tr key={i}><td>{m.user_id}</td><td>{m.role}</td><td>{new Date(m.added_at).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="muted">Jeśli chcesz widzieć e‑maile, użyj listy użytkowników w Supabase lub rozbuduj panel o widok profili.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}