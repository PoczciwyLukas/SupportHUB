import React, { useState } from 'react'
import { todayISO, uid } from '../utils'

export default function CompanySwitcher({ db, setDb, companyId, setCompanyId }){
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  function addCompany(){
    if(!name.trim()) return
    const newCo = { id: uid(), name: name.trim(), createdAt: todayISO() }
    setDb({ ...db, companies: [...db.companies, newCo] })
    setCompanyId(newCo.id)
    setName("")
    setOpen(false)
  }
  function removeCurrent(){
    if(db.companies.length<=1) return
    if(!confirm("Usunąć bieżącą firmę? Z danymi!")) return
    const newCompanies = db.companies.filter(c=>c.id!==companyId)
    const newCompanyId = newCompanies[0]?.id || ""
    setCompanyId(newCompanyId)
    setDb({ ...db, companies: newCompanies, jobs: db.jobs.filter(j=>j.companyId!==companyId), inventory: db.inventory.filter(i=>i.companyId!==companyId)})
  }

  return (
    <div style={{display:'flex', gap:8, position:'relative'}}>
      <select className="input" value={companyId} onChange={(e)=>setCompanyId(e.target.value)} style={{width:220}}>
        {db.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn" onClick={()=>setOpen(v=>!v)}>Firmy ▾</button>
      {open && (
        <div className="card" style={{position:'absolute', right:0, top:'110%', width:280}}>
          <div className="body">
            <div className="muted" style={{fontSize:12}}>Zarządzaj</div>
            <div className="label">Nazwa firmy</div>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="np. ACME Sp. z o.o."/>
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <button className="btn primary" onClick={addCompany}>Dodaj</button>
              {db.companies.length>1 && <button className="btn danger" onClick={removeCurrent}>Usuń bieżącą</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
