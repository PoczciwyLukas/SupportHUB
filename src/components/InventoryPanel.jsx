import React, { useMemo, useState } from 'react'
import { todayISO, uid } from '../utils'

export default function InventoryPanel({ db, setDb, companyId }){
  const [form, setForm] = useState({ sku:"", name:"", qty:1, location:"", minQty:0, toReturnUSA:false })
  const [search, setSearch] = useState("")
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
    if(!form.name.trim()) return alert("Podaj nazwę pozycji")
    const it = { id: uid(), companyId, sku: form.sku.trim(), name: form.name.trim(), qty: Math.max(0, Number(form.qty)||0), location: form.location.trim(), minQty: Math.max(0, Number(form.minQty)||0), toReturnUSA: !!form.toReturnUSA, createdAt: todayISO() }
    setDb({ ...db, inventory: [it, ...db.inventory] })
    setForm({ sku:"", name:"", qty:1, location:"", minQty:0, toReturnUSA:false })
  }
  function removeItem(id){
    if(!confirm("Usunąć pozycję z magazynu?")) return
    setDb({ ...db, inventory: db.inventory.filter(i=>i.id!==id) })
  }
  function adjustQty(id, delta){
    setDb({ ...db, inventory: db.inventory.map(i=> i.id===id ? { ...i, qty: Math.max(0, i.qty + delta) } : i) })
  }

  return (
    <div className="layout">
      <div className="card">
        <div className="header">Dodaj pozycję</div>
        <div className="body">
          <div className="label">Nazwa *</div>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="np. Moduł A / Kondensator 100uF"/>
          <div className="grid col-2">
            <div>
              <div className="label">SKU / indeks</div>
              <input className="input" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} placeholder="np. KND-100"/>
            </div>
            <div>
              <div className="label">Ilość początkowa</div>
              <input type="number" min="0" className="input" value={form.qty} onChange={e=>setForm({...form, qty:Number(e.target.value)})}/>
            </div>
          </div>
          <div className="grid col-2" style={{alignItems:'center'}}>
            <div>
              <div className="label">Lokalizacja</div>
              <input className="input" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="np. Regał A3"/>
            </div>
            <div>
              <div className="label">Stan minimalny</div>
              <input type="number" min="0" className="input" value={form.minQty} onChange={e=>setForm({...form, minQty:Number(e.target.value)})}/>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <input id="toReturnUSA" type="checkbox" checked={form.toReturnUSA} onChange={e=>setForm({...form, toReturnUSA:e.target.checked})} />
            <label className="dim" htmlFor="toReturnUSA">Oznacz jako „do odesłania do USA”</label>
          </div>
          <button className="btn primary" onClick={addItem} style={{marginTop:10}}>Dodaj do magazynu</button>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="body">
            <input className="input" placeholder="Szukaj w magazynie" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{marginTop:16}}>
          <div className="header">Stan magazynu</div>
          <div className="body" style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>Nazwa</th><th>SKU</th><th>Lokalizacja</th><th>Stan</th><th>Min</th><th>Do USA</th><th>Akcje</th></tr></thead>
              <tbody>
                {shown.map(i => (
                  <tr key={i.id} className={i.qty <= i.minQty ? "low" : ""}>
                    <td style={{fontWeight:600}}>{i.name}</td>
                    <td>{i.sku}</td>
                    <td>{i.location}</td>
                    <td>
                      <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                        {i.qty}
                        {i.qty <= i.minQty && <span className="badge">Niski stan</span>}
                      </span>
                    </td>
                    <td>{i.minQty}</td>
                    <td>{i.toReturnUSA ? "tak" : "nie"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn" onClick={()=>adjustQty(i.id, +1)}>+1</button>
                        <button className="btn" onClick={()=>adjustQty(i.id, -1)}>-1</button>
                        <button className="btn danger" onClick={()=>removeItem(i.id)}>Usuń</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length===0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'16px'}} className="dim">Magazyn pusty</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
