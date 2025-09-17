import React, { useMemo, useState } from 'react'
import RepairQueuePanel from './RepairQueuePanel.jsx'
import { todayISO, uid } from '../utils'
import { useLanguage } from '../i18n.jsx'

export default function InventoryPanel({ db, setDb, companyId }){
  const [form, setForm] = useState({ sku:"", name:"", qty:1, location:"", minQty:0 })
  const [search, setSearch] = useState("")
  const { t } = useLanguage()
  const items = useMemo(()=> db.inventory.filter(i=>i.companyId===companyId), [db, companyId])
  const shown = useMemo(()=>{
    let arr=[...items]
    if(search.trim()){
      const q=search.toLowerCase()
      arr=arr.filter(i => [i.sku, i.name, i.location].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)))
    }
    return arr.sort((a,b)=> a.name.localeCompare(b.name))
  }, [items, search])

  function addItem(){
    if(!form.name.trim()) return alert(t('inventory.alerts.nameRequired'))
    const it = { id: uid(), companyId, sku: form.sku.trim(), name: form.name.trim(), qty: Math.max(0, Number(form.qty)||0), location: form.location.trim(), minQty: Math.max(0, Number(form.minQty)||0), createdAt: todayISO() }
    setDb({ ...db, inventory: [it, ...db.inventory] })
    setForm({ sku:"", name:"", qty:1, location:"", minQty:0 })
  }
  function removeItem(id){
    if(!confirm(t('inventory.confirm.delete'))) return
    setDb({ ...db, inventory: db.inventory.filter(i=>i.id!==id) })
  }
  function adjustQty(id, delta){
    setDb({ ...db, inventory: db.inventory.map(i=> i.id===id ? { ...i, qty: Math.max(0, i.qty + delta) } : i) })
  }

  return (
    <div className="layout">
      <div className="card">
        <div className="header">{t('inventory.formTitle')}</div>
        <div className="body">
          <div className="label">{t('inventory.nameLabel')}</div>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder={t('inventory.namePlaceholder')}/>
          <div className="grid col-2">
            <div>
              <div className="label">{t('inventory.skuLabel')}</div>
              <input className="input" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} placeholder={t('inventory.skuPlaceholder')}/>
            </div>
            <div>
              <div className="label">{t('inventory.qtyLabel')}</div>
              <input type="number" min="0" className="input" value={form.qty} onChange={e=>setForm({...form, qty:Number(e.target.value)})}/>
            </div>
          </div>
          <div className="grid col-2" style={{alignItems:'center'}}>
            <div>
              <div className="label">{t('inventory.locationLabel')}</div>
              <input className="input" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder={t('inventory.locationPlaceholder')}/>
            </div>
            <div>
              <div className="label">{t('inventory.minQtyLabel')}</div>
              <input type="number" min="0" className="input" value={form.minQty} onChange={e=>setForm({...form, minQty:Number(e.target.value)})}/>
            </div>
          </div>
          <button className="btn primary" onClick={addItem} style={{marginTop:10}}>{t('inventory.addButton')}</button>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="body">
            <input className="input" placeholder={t('inventory.searchPlaceholder')} value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{marginTop:16}}>
          <div className="header">{t('inventory.tableTitle')}</div>
          <div className="body inventory-table">
            <table>
              <thead><tr><th>{t('inventory.columns.name')}</th><th>{t('inventory.columns.sku')}</th><th>{t('inventory.columns.location')}</th><th>{t('inventory.columns.qty')}</th><th>{t('inventory.columns.min')}</th><th>{t('inventory.columns.actions')}</th></tr></thead>
              <tbody>
                {shown.map(i => (
                  <tr key={i.id} className={i.qty <= i.minQty ? "low" : ""}>
                    <td style={{fontWeight:600}}>{i.name}</td>
                    <td>{i.sku}</td>
                    <td>{i.location}</td>
                    <td>
                      <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                        {i.qty}
                        {i.qty <= i.minQty && <span className="badge">{t('inventory.lowStockBadge')}</span>}
                      </span>
                    </td>
                    <td>{i.minQty}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn" onClick={()=>adjustQty(i.id, +1)}>{t('inventory.increment')}</button>
                        <button className="btn" onClick={()=>adjustQty(i.id, -1)}>{t('inventory.decrement')}</button>
                        <button className="btn danger" onClick={()=>removeItem(i.id)}>{t('inventory.remove')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length===0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'16px'}} className="dim">{t('inventory.empty')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{marginTop:16}}>
          <RepairQueuePanel db={db} setDb={setDb} companyId={companyId} />
        </div>
      </div>
    </div>
  )
}
