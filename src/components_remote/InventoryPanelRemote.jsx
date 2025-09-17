
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useOrg } from '../org/OrgProvider'

export default function InventoryPanelRemote(){
  const { currentOrg, role } = useOrg()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  const canWrite = role==='admin' || role==='operator'

  async function load(){
    if(!currentOrg) return
    const { data } = await supabase.from('inventory').select('*').eq('org_id', currentOrg.id).order('created_at', { ascending:false })
    setItems(data || [])
  }
  useEffect(()=>{ load() }, [currentOrg?.id])

  const shown = useMemo(()=>{
    let arr = [...items]
    if(q.trim()) {
      const s = q.toLowerCase()
      arr = arr.filter(x => [x.name, x.sku].some(f => (f||'').toLowerCase().includes(s)))
    }
    return arr
  }, [items, q])

  async function save(rec){
    if(!currentOrg) return
    const payload = { ...rec, org_id: currentOrg.id, qty: Number(rec.qty||0) }
    if(!rec.id){
      await supabase.from('inventory').insert(payload)
    } else {
      await supabase.from('inventory').update(payload).eq('id', rec.id)
    }
    setEdit(null); await load()
  }

  async function remove(id){
    await supabase.from('inventory').delete().eq('id', id)
    await load()
  }

  return (
    <div className="card">
      <div className="body">
        <h3>Magazyn</h3>
        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <input className="input" placeholder="Szukaj nazwy / SKU" value={q} onChange={e=>setQ(e.target.value)} />
          {canWrite && <button className="btn" onClick={()=>setEdit({ name:'', sku:'', qty:0 })}>Dodaj</button>}
        </div>

        <table style={{width:'100%'}}>
          <thead><tr><th>Nazwa</th><th>SKU</th><th>Ilość</th><th></th></tr></thead>
          <tbody>
            {shown.map(x => (
              <tr key={x.id}>
                <td>{x.name}</td><td>{x.sku}</td><td>{x.qty}</td>
                <td style={{textAlign:'right'}}>
                  {canWrite && (<>
                    <button className="btn" onClick={()=>setEdit(x)}>Edytuj</button>{' '}
                    <button className="btn" onClick={()=>remove(x.id)}>Usuń</button>
                  </>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {edit && (
          <div className="modal is-open">
            <div className="modal-backdrop" onClick={()=>setEdit(null)} />
            <div className="modal-content">
              <h3>{edit.id ? 'Edytuj pozycję' : 'Dodaj pozycję'}</h3>
              <div style={{display:'grid', gap:8}}>
                <input className="input" placeholder="Nazwa" value={edit.name||''} onChange={e=>setEdit({...edit, name:e.target.value})} />
                <input className="input" placeholder="SKU" value={edit.sku||''} onChange={e=>setEdit({...edit, sku:e.target.value})} />
                <input className="input" placeholder="Ilość" value={edit.qty||0} onChange={e=>setEdit({...edit, qty:Number(e.target.value||0)})} />
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={()=>save(edit)}>Zapisz</button>
                <button className="btn" onClick={()=>setEdit(null)}>Anuluj</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
