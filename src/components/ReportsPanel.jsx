import React, { useMemo, useState } from 'react'
import { DEFAULT_STATUSES, JOB_TYPES, fmtPLN } from '../utils'

export default function ReportsPanel({ jobs }){
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const inRange = useMemo(()=>{
    const f = from ? new Date(from + "T00:00:00").getTime() : -Infinity
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity
    return jobs.filter(j => {
      const ts = new Date(j.createdAt).getTime()
      return ts >= f && ts <= t
    })
  }, [jobs, from, to])

  const totalJobs = inRange.length
  const byStatus = DEFAULT_STATUSES.map(s => ({ status: s.value, label: s.label, count: inRange.filter(j=>j.status===s.value).length }))
  const byType = JOB_TYPES.map(t => ({ type: t.value, label: t.label, count: inRange.filter(j=>(j.jobType||"hub")===t.value).length }))

  const allUsages = inRange.flatMap(j=>j.inventoryUsed||[])
  const totalParts = allUsages.reduce((a,u)=>a+Number(u.qty||0),0)
  const keptParts = allUsages.filter(u=>u.disposition==="keep").reduce((a,u)=>a+Number(u.qty||0),0)
  const disposedParts = allUsages.filter(u=>u.disposition==="dispose").reduce((a,u)=>a+Number(u.qty||0),0)

  const shipInSum = inRange.reduce((s,j)=> s + Number(j.shipIn||0), 0)
  const shipOutSum = inRange.reduce((s,j)=> s + Number(j.shipOut||0), 0)
  const insInSum = inRange.reduce((s,j)=> s + Number(j.insIn||0), 0)
  const insOutSum = inRange.reduce((s,j)=> s + Number(j.insOut||0), 0)
  const shipTotal = shipInSum + shipOutSum + insInSum + insOutSum

  return (
    <div className="grid" style={{gap:16, gridTemplateColumns:'1fr 1fr'}}>
      <div className="card" style={{gridColumn:'1 / -1'}}>
        <div className="header">Zakres dat</div>
        <div className="body" style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr'}}>
          <div>
            <div className="label">Od</div>
            <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div>
            <div className="label">Do</div>
            <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="header">Podsumowanie zleceń</div>
        <div className="body">
          <div>Łącznie (w zakresie): <strong>{totalJobs}</strong></div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8}}>
            {byStatus.map(s => (
              <div key={s.status} className="card">
                <div className="body">
                  <div className="dim" style={{fontSize:12}}>{s.label}</div>
                  <div style={{fontSize:24, fontWeight:700}}>{s.count}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{height:1, background:'#e2e8f0', margin:'12px 0'}}></div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
            {byType.map(t => (
              <div key={t.type} className="card">
                <div className="body">
                  <div className="dim" style={{fontSize:12}}>{t.label}</div>
                  <div style={{fontSize:24, fontWeight:700}}>{t.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="header">Podsumowanie części</div>
        <div className="body">
          <div>Łącznie użytych (szt.): <strong>{totalParts}</strong></div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8}}>
            <div className="card">
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Pozostały u mnie</div>
                <div style={{fontSize:24, fontWeight:700}}>{keptParts}</div>
              </div>
            </div>
            <div className="card">
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Utylizacja</div>
                <div style={{fontSize:24, fontWeight:700}}>{disposedParts}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}>
        <div className="header">Koszty przesyłek (PLN)</div>
        <div className="body" style={{fontSize:14}}>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12}}>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>Przesyłka IN</div><div style={{fontSize:20, fontWeight:700}}>{fmtPLN(shipInSum)}</div></div></div>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>Przesyłka OUT</div><div style={{fontSize:20, fontWeight:700}}>{fmtPLN(shipOutSum)}</div></div></div>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>Ubezpieczenie IN</div><div style={{fontSize:20, fontWeight:700}}>{fmtPLN(insInSum)}</div></div></div>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>Ubezpieczenie OUT</div><div style={{fontSize:20, fontWeight:700}}>{fmtPLN(insOutSum)}</div></div></div>
          </div>
          <div style={{marginTop:8}}>Razem: <strong>{fmtPLN(shipTotal)}</strong></div>
        </div>
      </div>
    </div>
  )
}
