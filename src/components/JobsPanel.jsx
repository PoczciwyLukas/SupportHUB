import React, { useEffect, useMemo, useState } from 'react'
import { DEFAULT_STATUSES, JOB_TYPES, ensureUrlOrSearch, fmtPLN, isOverdue, todayISO, uid } from '../utils'

export default function JobsPanel({ db, setDb, companyId }){
  const emptyForm = { orderNumber:"", serialNumber:"", issueDesc:"", incomingTracking:"", outgoingTracking:"", actionsDesc:"", status:"nowe", jobType:"hub", dueDate:"", shipIn:"", shipOut:"", insIn:"", insOut:"" }
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [editId, setEditId] = useState(null)
  const [usageOpen, setUsageOpen] = useState(false)
  const [invUsage, setInvUsage] = useState([])

  useEffect(() => {
    if (usageOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [usageOpen])

  const jobs = useMemo(()=> db.jobs.filter(j=>j.companyId===companyId), [db, companyId])
  const inventory = useMemo(()=> db.inventory.filter(i=>i.companyId===companyId), [db, companyId])

  const shown = useMemo(()=>{
    let arr=[...jobs]
    if(statusFilter!=="all") arr=arr.filter(j=>j.status===statusFilter)
    if(typeFilter!=="all") arr=arr.filter(j=>(j.jobType||"hub")===typeFilter)
    if(search.trim()){
      const q=search.toLowerCase()
      arr=arr.filter(j => [j.orderNumber, j.serialNumber, j.issueDesc, j.actionsDesc, j.incomingTracking, j.outgoingTracking].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)))
    }
    return arr.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))
  }, [jobs, search, statusFilter, typeFilter])

  function reset(){ setForm(emptyForm); setEditId(null) }
  function save(){
    if(!form.orderNumber.trim()) return alert("Podaj numer zlecenia")
    const base = {
      companyId,
      orderNumber: form.orderNumber.trim(),
      serialNumber: form.serialNumber.trim(),
      issueDesc: form.issueDesc.trim(),
      incomingTracking: form.incomingTracking.trim(),
      outgoingTracking: form.outgoingTracking.trim(),
      actionsDesc: form.actionsDesc.trim(),
      status: form.status,
      jobType: form.jobType,
      dueDate: form.dueDate || "",
      shipIn: Number(form.shipIn||0), shipOut: Number(form.shipOut||0),
      insIn: Number(form.insIn||0), insOut: Number(form.insOut||0),
    }
    if(editId){
      setDb({ ...db, jobs: db.jobs.map(j => j.id===editId ? { ...j, ...base, updatedAt: todayISO() } : j) })
    } else {
      setDb({ ...db, jobs: [{ id: uid(), createdAt: todayISO(), updatedAt: todayISO(), inventoryUsed: [], ...base }, ...db.jobs] })
    }
    reset()
  }
  function edit(j){
    setEditId(j.id)
    setForm({
      orderNumber: j.orderNumber, serialNumber: j.serialNumber, issueDesc: j.issueDesc,
      incomingTracking: j.incomingTracking||"", outgoingTracking: j.outgoingTracking||"",
      actionsDesc: j.actionsDesc||"", status: j.status, jobType: j.jobType||"hub",
      dueDate: (j.dueDate||""), shipIn: String(j.shipIn??""), shipOut: String(j.shipOut??""), insIn: String(j.insIn??""), insOut: String(j.insOut??""),
    })
  }
  function del(id){
    if(!confirm("Usunąć zlecenie?")) return
    setDb({ ...db, jobs: db.jobs.filter(j=>j.id!==id) })
  }
  function openUsage(j){
    setEditId(j.id)
    setInvUsage(j.inventoryUsed||[])
    setUsageOpen(true)
  }
  function applyUsage(){
    const job = db.jobs.find(j=>j.id===editId)
    const before = job?.inventoryUsed||[]
    const after = invUsage
    const delta = new Map()
    for(const u of before) delta.set(u.itemId, (delta.get(u.itemId)||0) - Number(u.qty||0))
    for(const u of after) delta.set(u.itemId, (delta.get(u.itemId)||0) + Number(u.qty||0))
    const newInventory = db.inventory.map(it => {
      if(it.companyId!==companyId) return it
      const d = delta.get(it.id)||0
      return { ...it, qty: Math.max(0, it.qty - d) }
    })
    const newJobs = db.jobs.map(j => j.id===editId ? { ...j, inventoryUsed: after, updatedAt: todayISO() } : j)
    setDb({ ...db, inventory: newInventory, jobs: newJobs })
    setUsageOpen(false)
    setEditId(null)
  }

  const totalShip = (j)=> Number(j.shipIn||0)+Number(j.shipOut||0)+Number(j.insIn||0)+Number(j.insOut||0)

  return (
    <div className="layout">
      <div className="card">
        <div className="header">{editId ? "Edytuj zlecenie" : "Nowe zlecenie"}</div>
        <div className="body">
          <div className="label">Numer zlecenia *</div>
          <input className="input" value={form.orderNumber} onChange={e=>setForm({...form, orderNumber:e.target.value})} placeholder="np. ZL-2025-001"/>
          <div className="label" style={{marginTop:10}}>Numer seryjny urządzenia</div>
          <input className="input" value={form.serialNumber} onChange={e=>setForm({...form, serialNumber:e.target.value})} placeholder="np. SN123456"/>
          <div className="label" style={{marginTop:10}}>Opis usterki</div>
          <textarea className="input" value={form.issueDesc} onChange={e=>setForm({...form, issueDesc:e.target.value})} placeholder="Co się dzieje z urządzeniem?" />
          <div className="grid col-2">
            <div>
              <div className="label">Tracking (przychodzący)</div>
              <div style={{display:'flex', gap:8}}>
                <input className="input" value={form.incomingTracking} onChange={e=>setForm({...form, incomingTracking:e.target.value})} placeholder="URL lub numer listu"/>
                <a className="btn" href={ensureUrlOrSearch(form.incomingTracking)||'#'} target="_blank" rel="noreferrer">Otwórz</a>
              </div>
            </div>
            <div>
              <div className="label">Tracking (wychodzący)</div>
              <div style={{display:'flex', gap:8}}>
                <input className="input" value={form.outgoingTracking} onChange={e=>setForm({...form, outgoingTracking:e.target.value})} placeholder="URL lub numer listu"/>
                <a className="btn" href={ensureUrlOrSearch(form.outgoingTracking)||'#'} target="_blank" rel="noreferrer">Otwórz</a>
              </div>
            </div>
          </div>
          <div className="label" style={{marginTop:10}}>Opis czynności wykonanych</div>
          <textarea className="input" value={form.actionsDesc} onChange={e=>setForm({...form, actionsDesc:e.target.value})} placeholder="Co zostało zrobione?" />
          <div className="grid col-2">
            <div>
              <div className="label">Status</div>
              <select className="input" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                {DEFAULT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Typ zlecenia</div>
              <select className="input" value={form.jobType} onChange={e=>setForm({...form, jobType:e.target.value})}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="label">Termin (SLA)</div>
            <input type="date" className="input" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
          </div>
          <div className="card" style={{marginTop:12}}>
            <div className="header">Koszty przesyłki i ubezpieczenia (PLN)</div>
            <div className="body">
              <div className="grid col-2">
                <div>
                  <div className="muted" style={{fontSize:12, marginBottom:6}}>PRZYCHODZĄCA (IN)</div>
                  <div className="label">Koszt przesyłki (IN)</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.shipIn} onChange={e=>setForm({...form, shipIn:e.target.value})} placeholder="np. 85.00" />
                  <div className="label" style={{marginTop:10}}>Ubezpieczenie (IN)</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.insIn} onChange={e=>setForm({...form, insIn:e.target.value})} placeholder="np. 12.00" />
                </div>
                <div>
                  <div className="muted" style={{fontSize:12, marginBottom:6}}>WYCHODZĄCA (OUT)</div>
                  <div className="label">Koszt przesyłki (OUT)</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.shipOut} onChange={e=>setForm({...form, shipOut:e.target.value})} placeholder="np. 95.00" />
                  <div className="label" style={{marginTop:10}}>Ubezpieczenie (OUT)</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.insOut} onChange={e=>setForm({...form, insOut:e.target.value})} placeholder="np. 15.00" />
                </div>
              </div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="btn primary" onClick={save}>{editId ? "Zapisz zmiany" : "Dodaj zlecenie"}</button>
            {editId && <button className="btn" onClick={reset}>Anuluj</button>}
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="body" style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <div style={{position:'relative', flex:1, minWidth:220}}>
              <input className="input" placeholder="Szukaj (nr, SN, opis...)" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{width:180}}>
              <option value="all">Wszystkie statusy</option>
              {DEFAULT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="input" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{width:220}}>
              <option value="all">Wszystkie typy</option>
              {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{marginTop:16}}>
          <div className="header">Lista zleceń</div>
          <div className="body" style={{overflowX:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>Numer</th><th>SN</th><th>Typ</th><th>SLA</th><th>Status</th><th>Utworzono</th><th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(j => (
                  <React.Fragment key={j.id}>
                    <tr>
                      <td style={{fontWeight:600}}>{j.orderNumber}</td>
                      <td>{j.serialNumber}</td>
                      <td><span className="badge">{JOB_TYPES.find(t=>t.value===j.jobType)?.label || j.jobType}</span></td>
                      <td>{j.dueDate ? <span className={isOverdue(j.dueDate) && !["zakonczone","odeslane"].includes(j.status) ? "danger-text":""}>{new Date(j.dueDate).toLocaleDateString()}</span> : "—"}</td>
                      <td>{DEFAULT_STATUSES.find(s=>s.value===j.status)?.label || j.status}</td>
                      <td>{new Date(j.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn" onClick={()=>edit(j)}>Edytuj</button>
                          <button className="btn" onClick={()=>openUsage(j)}>Części</button>
                          <button className="btn danger" onClick={()=>del(j.id)}>Usuń</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={7}>
                        <JobDetails job={j} total={totalShip(j)} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {shown.length===0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'16px', color:'#64748b'}}>Brak zleceń spełniających kryteria</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {usageOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999
          }}
        >
          <div className="card" style={{ maxWidth: 720, width: '100%' }}>
            <div className="header">Zużycie części</div>
            <div className="body">
              <InventoryUsageEditor usage={invUsage} setUsage={setInvUsage} inventory={inventory} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn primary" onClick={applyUsage}>Zapisz i zaktualizuj magazyn</button>
                <button className="btn" onClick={() => { setUsageOpen(false); setEditId(null); }}>Anuluj</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JobDetails({ job, total }){
  return (
    <div style={{marginTop:8, background:'#f1f5f9', borderRadius:12, padding:12, fontSize:12, color:'#334155'}}>
      <div className="grid col-2">
        <div>
          <div><strong>SN:</strong> {job.serialNumber || "—"}</div>
          <div><strong>Usterka:</strong> {job.issueDesc || "—"}</div>
          <div><strong>Czynności:</strong> {job.actionsDesc || "—"}</div>
          <div><strong>Typ:</strong> {JOB_TYPES.find(t=>t.value===job.jobType)?.label || job.jobType}</div>
          <div><strong>Termin (SLA):</strong> {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "—"}</div>
        </div>
        <div>
          <div><strong>Tracking IN:</strong> {job.incomingTracking || "—"}</div>
          <div><strong>Tracking OUT:</strong> {job.outgoingTracking || "—"}</div>
          <div><strong>Ostatnia zmiana:</strong> {new Date(job.updatedAt || job.createdAt).toLocaleString()}</div>
          <div style={{marginTop:4}}><strong>Koszty przesyłek:</strong> {fmtPLN(total || 0)}</div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:4, marginTop:4}}>
            <div>IN: {fmtPLN(Number(job.shipIn||0))} • Ubezp: {fmtPLN(Number(job.insIn||0))}</div>
            <div>OUT: {fmtPLN(Number(job.shipOut||0))} • Ubezp: {fmtPLN(Number(job.insOut||0))}</div>
          </div>
        </div>
      </div>
      <div style={{borderTop:'1px solid #e2e8f0', margin:'8px 0'}}></div>
      <div style={{fontWeight:600, marginBottom:4}}>Zużyte części:</div>
      {(!job.inventoryUsed || job.inventoryUsed.length===0) ? (
        <div className="dim">Brak</div>
      ) : (
        <ul style={{paddingLeft:18, margin:0}}>
          {job.inventoryUsed.map((u, idx) => (
            <li key={idx}>{u.name} (SKU: {u.sku}) — {u.qty} szt. — los: {u.disposition==="return"?"zwrócone do USA": u.disposition==="dispose"?"utylizacja":"pozostaje u mnie"}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InventoryUsageEditor({ usage, setUsage, inventory }){
  const [itemId, setItemId] = useState("")
  const [qty, setQty] = useState(1)
  const [disp, setDisp] = useState("keep")
  function add(){
    if(!itemId || qty<1) return
    const item = inventory.find(i=>i.id===itemId)
    if(!item) return
    setUsage(prev => {
      const ex = prev.find(u => u.itemId===itemId && u.disposition===disp)
      if(ex) return prev.map(u => (u.itemId===itemId && u.disposition===disp) ? { ...u, qty: u.qty + qty } : u)
      return [...prev, { itemId, sku:item.sku, name:item.name, qty, disposition: disp }]
    })
    setItemId(""); setQty(1); setDisp("keep")
  }
  function removeLine(id, d){ setUsage(usage.filter(u => !(u.itemId===id && u.disposition===d))) }
  return (
    <div>
      <div className="grid" style={{gridTemplateColumns:'1fr 120px 220px 120px', gap:12, alignItems:'end'}}>
        <div>
          <div className="label">Pozycja z magazynu</div>
          <select className="input" value={itemId} onChange={e=>setItemId(e.target.value)}>
            <option value="">— wybierz —</option>
            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (SKU: {i.sku}) — dostępne: {i.qty}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Ilość</div>
          <input type="number" min="1" className="input" value={qty} onChange={e=>setQty(parseInt(e.target.value||"1"))}/>
        </div>
        <div>
          <div className="label">Los części</div>
          <select className="input" value={disp} onChange={e=>setDisp(e.target.value)}>
            <option value="keep">Pozostaje u mnie</option>
            <option value="return">Zwrócić do USA</option>
            <option value="dispose">Utylizacja</option>
          </select>
        </div>
        <div><button className="btn primary" onClick={add} style={{width:'100%'}}>Dodaj</button></div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="body" style={{overflowX:'auto'}}>
          <table>
            <thead><tr><th>Nazwa</th><th>SKU</th><th>Ilość</th><th>Los</th><th></th></tr></thead>
            <tbody>
              {usage.length===0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:'12px'}} className="dim">Nic nie dodano</td></tr>
              ) : usage.map((u, idx) => (
                <tr key={idx}>
                  <td>{u.name}</td><td>{u.sku}</td><td>{u.qty}</td><td>{u.disposition==="return"?"zwrócić do USA":u.disposition==="dispose"?"utylizacja":"pozostaje u mnie"}</td>
                  <td style={{textAlign:'right'}}><button className="btn ghost" onClick={()=>removeLine(u.itemId, u.disposition)}>Usuń</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
