import React, { useMemo } from 'react'
import { todayISO, uid } from '../utils'

const DISPOSITION_LABELS = {
  keep: 'pozostaje u mnie',
  dispose: 'utylizacja',
  renew: 'odnowienie',
  return: 'odesłanie do producenta',
}

export default function RepairQueuePanel({ db, setDb, companyId }){
  const repairQueue = useMemo(() => db.repairQueue.filter(r => r.companyId === companyId), [db, companyId])
  const jobMap = useMemo(() => {
    const map = new Map()
    for(const j of db.jobs){
      if(j.companyId === companyId) map.set(j.id, j)
    }
    return map
  }, [db, companyId])

  function resolveQueueItem(id, action){
    const entry = db.repairQueue.find(r=>r.id===id && r.companyId===companyId)
    if(!entry) return
    const qty = Number(entry.qty||0)
    const remainingQueue = db.repairQueue.filter(r=>r.id!==id)

    let inventoryUpdate = db.inventory
    if(action==='ok' && entry.itemId){
      inventoryUpdate = db.inventory.map(it => {
        if(it.id===entry.itemId && it.companyId===companyId){
          return { ...it, qty: it.qty + qty }
        }
        return it
      })
    }

    let partEventsUpdate = db.partEvents
    if(action==='bad' || action==='return'){
      const type = action==='bad' ? 'dispose' : 'return'
      partEventsUpdate = [
        ...db.partEvents,
        {
          id: uid(),
          companyId,
          jobId: entry.jobId,
          itemId: entry.itemId,
          sku: entry.sku,
          name: entry.name,
          qty,
          type,
          eventDate: todayISO(),
        }
      ]
    }

    setDb({
      ...db,
      inventory: inventoryUpdate,
      repairQueue: remainingQueue,
      partEvents: partEventsUpdate,
    })
  }

  const queueOk = id => resolveQueueItem(id, 'ok')
  const queueBad = id => resolveQueueItem(id, 'bad')
  const queueReturn = id => resolveQueueItem(id, 'return')

  return (
    <div className="card">
      <div className="header">Kolejka części</div>
      <div className="body" style={{overflowX:'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Zlecenie</th>
              <th>Część</th>
              <th>SKU</th>
              <th>Ilość</th>
              <th>Los</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {repairQueue.length===0 ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:'16px'}} className="dim">Kolejka pusta</td></tr>
            ) : repairQueue
              .slice()
              .sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
              .map(item => {
                const job = jobMap.get(item.jobId)
                return (
                  <tr key={item.id}>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
                    <td>{job ? job.orderNumber : '—'}</td>
                    <td>{item.name}</td>
                    <td>{item.sku}</td>
                    <td>{item.qty}</td>
                    <td>{DISPOSITION_LABELS[item.disposition] || item.disposition}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn" onClick={()=>queueOk(item.id)} disabled={!item.itemId}>OK</button>
                        <button className="btn danger" onClick={()=>queueBad(item.id)}>BAD</button>
                        <button className="btn" onClick={()=>queueReturn(item.id)}>Odesłano</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
