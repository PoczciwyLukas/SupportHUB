
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useOrg } from '../org/OrgProvider'

const STATUS = ['nowe','wtrakcie','czeka','zakonczone','odeslane']
const TYPES = ['hub','onsite','upgrade']

export default function JobsPanelRemote(){
  const { currentOrg, role } = useOrg()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editing, setEditing] = useState(null)

  async function load(){
    if(!currentOrg) return
    const { data } = await supabase.from('jobs').select('*').eq('org_id', currentOrg.id).order('created_at', { ascending:false })
    setItems(data || [])
  }
  useEffect(()=>{ load() }, [currentOrg?.id])

  const shown = useMemo(()=>{
    let arr = [...items]
    if(statusFilter!=='all') arr = arr.filter(j => j.status===statusFilter)
    if(typeFilter!=='all') arr = arr.filter(j => (j.job_type||'hub')===typeFilter)
    if(search.trim()){
      const q = search.toLowerCase()
      arr = arr.filter(j => [j.order_number,j.serial_number,j.model,j.customer].some(f => (f||'').toLowerCase().includes(q)))
    }
    return arr
  }, [items, search, statusFilter, typeFilter])

  async function save(rec){
    if(!currentOrg) return
    const payload = { ...rec, org_id: currentOrg.id }
    if(!rec.id){
      await supabase.from('jobs').insert(payload)
    }else{
      await supabase.from('jobs').update(payload).eq('id', rec.id)
    }
    setEditing(null); await load()
  }
  async function remove(id){
    await supabase.from('jobs').delete().eq('id', id)
    await load()
  }

  const canWrite = role==='admin' || role==='operator'

  return (
    <div className="card">
      <div className="body">
        <h3>Zlecenia</h3>
        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <input className="input" placeholder="Szukaj..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">wszystkie statusy</option>
            {STATUS.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="all">wszystkie typy</option>
            {TYPES.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          {canWrite && <button className="btn" onClick={()=>setEditing({ status:'nowe', job_type:'hub' })}>Dodaj</button>}
        </div>

        <table style={{width:'100%'}}>
          <thead>
            <tr>
              <th>Numer</th><th>SN</th><th>Model</th><th>Klient</th><th>Status</th><th>Typ</th><th>IN</th><th>OUT</th><th>INS IN</th><th>INS OUT</th><th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(j => (
              <tr key={j.id}>
                <td>{j.order_number||''}</td>
                <td>{j.serial_number||''}</td>
                <td>{j.model||''}</td>
                <td>{j.customer||''}</td>
                <td>{j.status}</td>
                <td>{j.job_type}</td>
                <td>{j.ship_cost_in||0}</td>
                <td>{j.ship_cost_out||0}</td>
                <td>{j.ins_cost_in||0}</td>
                <td>{j.ins_cost_out||0}</td>
                <td style={{textAlign:'right'}}>
                  {canWrite && (<>
                    <button className="btn" onClick={()=>setEditing(j)}>Edytuj</button>{' '}
                    <button className="btn" onClick={()=>remove(j.id)}>Usuń</button>
                  </>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="modal is-open">
            <div className="modal-backdrop" onClick={()=>setEditing(null)} />
            <div className="modal-content">
              <h3>{editing.id ? 'Edytuj zlecenie' : 'Dodaj zlecenie'}</h3>
              <div style={{display:'grid', gap:8}}>
                <input className="input" placeholder="Numer zlecenia" value={editing.order_number||''} onChange={e=>setEditing({...editing, order_number:e.target.value})} />
                <input className="input" placeholder="Serial Number" value={editing.serial_number||''} onChange={e=>setEditing({...editing, serial_number:e.target.value})} />
                <input className="input" placeholder="Model" value={editing.model||''} onChange={e=>setEditing({...editing, model:e.target.value})} />
                <input className="input" placeholder="Klient" value={editing.customer||''} onChange={e=>setEditing({...editing, customer:e.target.value})} />
                <textarea className="input" placeholder="Co zrobiono?" value={editing.actions||''} onChange={e=>setEditing({...editing, actions:e.target.value})} />
                <div style={{display:'flex', gap:8}}>
                  <select className="input" value={editing.status} onChange={e=>setEditing({...editing, status:e.target.value})}>
                    {STATUS.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="input" value={editing.job_type} onChange={e=>setEditing({...editing, job_type:e.target.value})}>
                    {TYPES.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{display:'grid', gap:4}}>
                  <label>Koszty (PLN)</label>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
                    <input className="input" placeholder="Ship IN" value={editing.ship_cost_in||''} onChange={e=>setEditing({...editing, ship_cost_in: Number(e.target.value||0)})} />
                    <input className="input" placeholder="Ship OUT" value={editing.ship_cost_out||''} onChange={e=>setEditing({...editing, ship_cost_out: Number(e.target.value||0)})} />
                    <input className="input" placeholder="Ins IN" value={editing.ins_cost_in||''} onChange={e=>setEditing({...editing, ins_cost_in: Number(e.target.value||0)})} />
                    <input className="input" placeholder="Ins OUT" value={editing.ins_cost_out||''} onChange={e=>setEditing({...editing, ins_cost_out: Number(e.target.value||0)})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={()=>save(editing)}>Zapisz</button>
                <button className="btn" onClick={()=>setEditing(null)}>Anuluj</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
