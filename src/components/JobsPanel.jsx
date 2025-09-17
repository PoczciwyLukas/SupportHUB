import React, { useEffect, useMemo, useState } from 'react'
import {
  ensureUrlOrSearch,
  getDefaultStatuses,
  getDispositionLabel,
  getDispositionOptions,
  getJobTypes,
  isOverdue,
  todayISO,
  uid,
} from '../utils'
import { useLanguage } from '../i18n.jsx'

const DEFAULT_DISPOSITION = 'dispose'

export default function JobsPanel({ db, setDb, companyId }){
  const { t, locale, formatCurrency, formatDate, formatDateTime } = useLanguage()
  const emptyForm = {
    orderNumber: "",
    serialNumber: "",
    issueDesc: "",
    incomingTracking: "",
    outgoingTracking: "",
    actionsDesc: "",
    status: "nowe",
    jobType: "hub",
    dueDate: "",
    shipIn: "",
    shipOut: "",
    insIn: "",
    insOut: "",
  }
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

  const statuses = useMemo(() => getDefaultStatuses(t), [t])
  const jobTypes = useMemo(() => getJobTypes(t), [t])
  const dispositions = useMemo(() => getDispositionOptions(t), [t])
  const statusMap = useMemo(() => new Map(statuses.map(s => [s.value, s.label])), [statuses])
  const jobTypeMap = useMemo(() => new Map(jobTypes.map(s => [s.value, s.label])), [jobTypes])
  const dispositionMap = useMemo(() => new Map(dispositions.map(d => [d.value, d.label])), [dispositions])

  const jobs = useMemo(() => db.jobs.filter(j => j.companyId === companyId), [db, companyId])
  const inventory = useMemo(() => db.inventory.filter(i => i.companyId === companyId), [db, companyId])
  const shown = useMemo(() => {
    let arr = [...jobs]
    if (statusFilter !== "all") arr = arr.filter(j => j.status === statusFilter)
    if (typeFilter !== "all") arr = arr.filter(j => (j.jobType || "hub") === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(j => [
        j.orderNumber,
        j.serialNumber,
        j.issueDesc,
        j.actionsDesc,
        j.incomingTracking,
        j.outgoingTracking,
      ].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
    }
    return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [jobs, search, statusFilter, typeFilter])

  function reset(){
    setForm(emptyForm)
    setEditId(null)
  }

  function save(){
    if(!form.orderNumber.trim()) return alert(t('jobs.alerts.orderNumberRequired'))
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
      shipIn: Number(form.shipIn || 0),
      shipOut: Number(form.shipOut || 0),
      insIn: Number(form.insIn || 0),
      insOut: Number(form.insOut || 0),
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
      orderNumber: j.orderNumber,
      serialNumber: j.serialNumber,
      issueDesc: j.issueDesc,
      incomingTracking: j.incomingTracking || "",
      outgoingTracking: j.outgoingTracking || "",
      actionsDesc: j.actionsDesc || "",
      status: j.status,
      jobType: j.jobType || "hub",
      dueDate: (j.dueDate || ""),
      shipIn: String(j.shipIn ?? ""),
      shipOut: String(j.shipOut ?? ""),
      insIn: String(j.insIn ?? ""),
      insOut: String(j.insOut ?? ""),
    })
  }

  function del(id){
    if(!confirm(t('jobs.confirm.delete'))) return
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
    const baseRepairQueue = db.repairQueue.filter(r => r.jobId !== editId)
    const repairAdds = []
    const partAdds = []
    for(const u of after){
      const qty = Number(u.qty||0)
      if(u.disposition === 'renew' || u.disposition === 'return'){
        repairAdds.push({ id: uid(), jobId: editId, itemId: u.itemId, name: u.name, sku: u.sku, qty, disposition: u.disposition, companyId, createdAt: todayISO() })
      } else if(u.disposition === 'dispose'){
        partAdds.push({ id: uid(), companyId, jobId: editId, itemId: u.itemId, sku: u.sku, name: u.name, qty, type: 'dispose', eventDate: todayISO() })
      }
    }
    const newRepairQueue = [...baseRepairQueue, ...repairAdds]
    const newPartEvents = [...db.partEvents, ...partAdds]
    setDb({ ...db, inventory: newInventory, jobs: newJobs, repairQueue: newRepairQueue, partEvents: newPartEvents })
    setUsageOpen(false)
    setEditId(null)
  }

  const totalShip = (j)=> Number(j.shipIn||0)+Number(j.shipOut||0)+Number(j.insIn||0)+Number(j.insOut||0)

  return (
    <div className="layout">
      <div className="card">
        <div className="header">{editId ? t('jobs.titleEdit') : t('jobs.titleNew')}</div>
        <div className="body form-stack">
          <div className="form-row">
            <div className="label">{t('jobs.form.orderNumberLabel')}</div>
            <input className="input" value={form.orderNumber} onChange={e=>setForm({...form, orderNumber:e.target.value})} placeholder={t('jobs.form.orderNumberPlaceholder')}/>
          </div>
          <div className="form-row">
            <div className="label">{t('jobs.form.serialLabel')}</div>
            <input className="input" value={form.serialNumber} onChange={e=>setForm({...form, serialNumber:e.target.value})} placeholder={t('jobs.form.serialPlaceholder')}/>
          </div>
          <div className="form-row">
            <div className="label">{t('jobs.form.issueLabel')}</div>
            <textarea className="input" value={form.issueDesc} onChange={e=>setForm({...form, issueDesc:e.target.value})} placeholder={t('jobs.form.issuePlaceholder')} />
          </div>
          <div className="form-columns">
            <div className="form-row">
              <div className="label">{t('jobs.form.incomingTrackingLabel')}</div>
              <div className="form-inline">
                <input className="input" value={form.incomingTracking} onChange={e=>setForm({...form, incomingTracking:e.target.value})} placeholder={t('jobs.form.trackingPlaceholder')}/>
                <a className="btn" href={ensureUrlOrSearch(form.incomingTracking)||'#'} target="_blank" rel="noreferrer">{t('jobs.form.openLink')}</a>
              </div>
            </div>
            <div className="form-row">
              <div className="label">{t('jobs.form.outgoingTrackingLabel')}</div>
              <div className="form-inline">
                <input className="input" value={form.outgoingTracking} onChange={e=>setForm({...form, outgoingTracking:e.target.value})} placeholder={t('jobs.form.trackingPlaceholder')}/>
                <a className="btn" href={ensureUrlOrSearch(form.outgoingTracking)||'#'} target="_blank" rel="noreferrer">{t('jobs.form.openLink')}</a>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="label">{t('jobs.form.actionsLabel')}</div>
            <textarea className="input" value={form.actionsDesc} onChange={e=>setForm({...form, actionsDesc:e.target.value})} placeholder={t('jobs.form.actionsPlaceholder')} />
          </div>
          <div className="form-columns">
            <div className="form-row">
              <div className="label">{t('jobs.form.statusLabel')}</div>
              <select className="input" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="label">{t('jobs.form.typeLabel')}</div>
              <select className="input" value={form.jobType} onChange={e=>setForm({...form, jobType:e.target.value})}>
                {jobTypes.map(tpl => <option key={tpl.value} value={tpl.value}>{tpl.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="label">{t('jobs.form.dueDateLabel')}</div>
            <input type="date" className="input" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
          </div>
          <div className="form-section">
            <div className="form-section-title">{t('jobs.form.shipmentsTitle')}</div>
            <div className="form-columns">
              <div className="form-stack">
                <div className="form-section-caption muted">{t('jobs.form.shipmentsInCaption')}</div>
                <div className="form-row">
                  <div className="label">{t('jobs.form.shipInLabel')}</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.shipIn} onChange={e=>setForm({...form, shipIn:e.target.value})} placeholder={t('jobs.form.shipPlaceholder')} />
                </div>
                <div className="form-row">
                  <div className="label">{t('jobs.form.insuranceInLabel')}</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.insIn} onChange={e=>setForm({...form, insIn:e.target.value})} placeholder={t('jobs.form.insurancePlaceholder')} />
                </div>
              </div>
              <div className="form-stack">
                <div className="form-section-caption muted">{t('jobs.form.shipmentsOutCaption')}</div>
                <div className="form-row">
                  <div className="label">{t('jobs.form.shipOutLabel')}</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.shipOut} onChange={e=>setForm({...form, shipOut:e.target.value})} placeholder={t('jobs.form.shipPlaceholder')} />
                </div>
                <div className="form-row">
                  <div className="label">{t('jobs.form.insuranceOutLabel')}</div>
                  <input type="number" min="0" step="0.01" className="input" value={form.insOut} onChange={e=>setForm({...form, insOut:e.target.value})} placeholder={t('jobs.form.insurancePlaceholder')} />
                </div>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn primary" onClick={save}>{editId ? t('jobs.form.saveButton') : t('jobs.form.addButton')}</button>
            {editId && <button className="btn" onClick={reset}>{t('jobs.form.cancelButton')}</button>}
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="body filter-bar">
            <div className="filter-bar__search">
              <input className="input" placeholder={t('jobs.filters.searchPlaceholder')} value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">{t('jobs.filters.statusAll')}</option>
              {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="input" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="all">{t('jobs.filters.typeAll')}</option>
              {jobTypes.map(tpl => <option key={tpl.value} value={tpl.value}>{tpl.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{marginTop:16}}>
          <div className="header">{t('jobs.list.title')}</div>
          <div className="body" style={{overflowX:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>{t('jobs.list.columns.number')}</th>
                  <th>{t('jobs.list.columns.serial')}</th>
                  <th>{t('jobs.list.columns.type')}</th>
                  <th>{t('jobs.list.columns.sla')}</th>
                  <th>{t('jobs.list.columns.status')}</th>
                  <th>{t('jobs.list.columns.createdAt')}</th>
                  <th>{t('jobs.list.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(j => (
                  <React.Fragment key={j.id}>
                    <tr>
                      <td style={{fontWeight:600}}>{j.orderNumber}</td>
                      <td>{j.serialNumber}</td>
                      <td><span className="badge">{jobTypeMap.get(j.jobType || 'hub') || j.jobType}</span></td>
                      <td>{j.dueDate ? <span className={isOverdue(j.dueDate) && !["zakonczone","odeslane"].includes(j.status) ? 'danger-text' : ''}>{formatDate(j.dueDate) || '—'}</span> : '—'}</td>
                      <td>{statusMap.get(j.status) || j.status}</td>
                      <td>{formatDateTime(j.createdAt) || new Date(j.createdAt).toLocaleString(locale)}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn" onClick={()=>edit(j)}>{t('jobs.list.actionEdit')}</button>
                          <button className="btn" onClick={()=>openUsage(j)}>{t('jobs.list.actionParts')}</button>
                          <button className="btn danger" onClick={()=>del(j.id)}>{t('jobs.list.actionDelete')}</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={7}>
                        <JobDetails job={j} total={totalShip(j)} jobTypeMap={jobTypeMap} dispositionMap={dispositionMap} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {shown.length===0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'16px', color:'#64748b'}}>{t('jobs.list.empty')}</td></tr>}
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
            <div className="header">{t('jobs.usageModal.title')}</div>
            <div className="body">
              <InventoryUsageEditor usage={invUsage} setUsage={setInvUsage} inventory={inventory} dispositions={dispositions} dispositionMap={dispositionMap} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn primary" onClick={applyUsage}>{t('jobs.usageModal.apply')}</button>
                <button className="btn" onClick={() => { setUsageOpen(false); setEditId(null); }}>{t('jobs.usageModal.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JobDetails({ job, total, jobTypeMap, dispositionMap }){
  const { t, formatCurrency, formatDate, formatDateTime } = useLanguage()
  const typeLabel = jobTypeMap.get(job.jobType || 'hub') || job.jobType
  const dueDate = job.dueDate ? (formatDate(job.dueDate) || formatDate(new Date(job.dueDate))) : '—'
  const updated = formatDateTime(job.updatedAt || job.createdAt)
  const shipmentTotal = formatCurrency(total || 0)
  const inboundShip = formatCurrency(Number(job.shipIn||0))
  const outboundShip = formatCurrency(Number(job.shipOut||0))
  const inboundIns = formatCurrency(Number(job.insIn||0))
  const outboundIns = formatCurrency(Number(job.insOut||0))

  return (
    <div style={{marginTop:8, background:'#f1f5f9', borderRadius:12, padding:12, fontSize:12, color:'#334155'}}>
      <div className="grid col-2">
        <div>
          <div><strong>{t('jobs.details.serial')}</strong> {job.serialNumber || '—'}</div>
          <div><strong>{t('jobs.details.issue')}</strong> {job.issueDesc || '—'}</div>
          <div><strong>{t('jobs.details.actions')}</strong> {job.actionsDesc || '—'}</div>
          <div><strong>{t('jobs.details.type')}</strong> {typeLabel}</div>
          <div><strong>{t('jobs.details.sla')}</strong> {dueDate}</div>
        </div>
        <div>
          <div><strong>{t('jobs.details.trackingIn')}</strong> {job.incomingTracking || '—'}</div>
          <div><strong>{t('jobs.details.trackingOut')}</strong> {job.outgoingTracking || '—'}</div>
          <div><strong>{t('jobs.details.updatedAt')}</strong> {updated || '—'}</div>
          <div style={{marginTop:4}}><strong>{t('jobs.details.shipmentCosts')}</strong> {shipmentTotal}</div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:4, marginTop:4}}>
            <div>{t('jobs.details.inboundLabel')}: {inboundShip} • {t('jobs.details.insuranceShort')}: {inboundIns}</div>
            <div>{t('jobs.details.outboundLabel')}: {outboundShip} • {t('jobs.details.insuranceShort')}: {outboundIns}</div>
          </div>
        </div>
      </div>
      <div style={{borderTop:'1px solid #e2e8f0', margin:'8px 0'}}></div>
      <div style={{fontWeight:600, marginBottom:4}}>{t('jobs.details.usageTitle')}</div>
      {(!job.inventoryUsed || job.inventoryUsed.length===0) ? (
        <div className="dim">{t('jobs.details.noUsage')}</div>
      ) : (
        <ul style={{paddingLeft:18, margin:0}}>
          {job.inventoryUsed.map((u, idx) => {
            const label = dispositionMap.get(u.disposition) || getDispositionLabel(u.disposition, t)
            return (
              <li key={idx}>
                {u.name} (SKU: {u.sku}) — {t('jobs.details.quantityWithUnit', { qty: u.qty })} — {t('jobs.details.dispositionPrefix', { label })}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function InventoryUsageEditor({ usage, setUsage, inventory, dispositions, dispositionMap }){
  const { t } = useLanguage()
  const [itemId, setItemId] = useState("")
  const [qty, setQty] = useState(1)
  const [disp, setDisp] = useState(DEFAULT_DISPOSITION)

  function add(){
    if(!itemId || qty<1 || !disp) return
    const item = inventory.find(i=>i.id===itemId)
    if(!item) return
    setUsage(prev => {
      const ex = prev.find(u => u.itemId===itemId && u.disposition===disp)
      if(ex) return prev.map(u => (u.itemId===itemId && u.disposition===disp) ? { ...u, qty: u.qty + qty } : u)
      return [...prev, { itemId, sku:item.sku, name:item.name, qty, disposition: disp }]
    })
    setItemId("")
    setQty(1)
    setDisp(DEFAULT_DISPOSITION)
  }

  function removeLine(id, d){
    setUsage(usage.filter(u => !(u.itemId===id && u.disposition===d)))
  }

  return (
    <div>
      <div className="grid" style={{gridTemplateColumns:'1fr 120px 220px 120px', gap:12, alignItems:'end'}}>
        <div>
          <div className="label">{t('jobs.usageModal.selectorLabel')}</div>
          <select className="input" value={itemId} onChange={e=>setItemId(e.target.value)}>
            <option value="">{t('jobs.usageModal.selectorPlaceholder')}</option>
            {inventory.map(i => (
              <option key={i.id} value={i.id}>
                {t('jobs.usageModal.inventoryOption', { name: i.name, sku: i.sku, qty: i.qty })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">{t('jobs.usageModal.quantityLabel')}</div>
          <input
            type="number"
            min="1"
            className="input"
            value={qty}
            onChange={e => {
              const next = parseInt(e.target.value || '1', 10)
              setQty(Number.isNaN(next) ? 1 : Math.max(1, next))
            }}
          />
        </div>
        <div>
          <div className="label">{t('jobs.usageModal.dispositionLabel')}</div>
          <select className="input" value={disp} onChange={e=>setDisp(e.target.value)}>
            {dispositions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <button className="btn primary" onClick={add} style={{width:'100%'}} disabled={!itemId || qty<1 || !disp}>{t('jobs.usageModal.addButton')}</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="body" style={{overflowX:'auto'}}>
          <table>
            <thead>
              <tr>
                <th>{t('jobs.usageModal.tableHeaders.name')}</th>
                <th>{t('jobs.usageModal.tableHeaders.sku')}</th>
                <th>{t('jobs.usageModal.tableHeaders.qty')}</th>
                <th>{t('jobs.usageModal.tableHeaders.disposition')}</th>
                <th>{t('jobs.usageModal.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {usage.length===0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:'12px'}} className="dim">{t('jobs.usageModal.empty')}</td></tr>
              ) : usage.map((u, idx) => (
                <tr key={idx}>
                  <td>{u.name}</td>
                  <td>{u.sku}</td>
                  <td>{u.qty}</td>
                  <td>{dispositionMap.get(u.disposition) || getDispositionLabel(u.disposition, t)}</td>
                  <td style={{textAlign:'right'}}><button className="btn ghost" onClick={()=>removeLine(u.itemId, u.disposition)}>{t('jobs.usageModal.remove')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

