
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useOrg } from '../org/OrgProvider'

export default function ReportsPanelRemote(){
  const { currentOrg } = useOrg()
  const [jobs, setJobs] = useState([])

  async function load(){
    if(!currentOrg) return
    const { data } = await supabase.from('jobs').select('*').eq('org_id', currentOrg.id)
    setJobs(data||[])
  }
  useEffect(()=>{ load() }, [currentOrg?.id])

  const sums = useMemo(()=>{
    const s = { in:0, out:0, insIn:0, insOut:0, total:0 }
    for(const j of jobs){
      s.in += Number(j.ship_cost_in||0)
      s.out += Number(j.ship_cost_out||0)
      s.insIn += Number(j.ins_cost_in||0)
      s.insOut += Number(j.ins_cost_out||0)
    }
    s.total = s.in + s.out + s.insIn + s.insOut
    return s
  }, [jobs])

  return (
    <div className="card">
      <div className="body">
        <h3>Raport kosztów</h3>
        <div className="muted">Sumy z tabeli „jobs” dla bieżącej firmy.</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginTop:12}}>
          <div className="card"><div className="body"><div>Shipping IN</div><strong>{sums.in.toFixed(2)} PLN</strong></div></div>
          <div className="card"><div className="body"><div>Shipping OUT</div><strong>{sums.out.toFixed(2)} PLN</strong></div></div>
          <div className="card"><div className="body"><div>Insurance IN</div><strong>{sums.insIn.toFixed(2)} PLN</strong></div></div>
          <div className="card"><div className="body"><div>Insurance OUT</div><strong>{sums.insOut.toFixed(2)} PLN</strong></div></div>
          <div className="card"><div className="body"><div>RAZEM</div><strong>{sums.total.toFixed(2)} PLN</strong></div></div>
        </div>
      </div>
    </div>
  )
}
