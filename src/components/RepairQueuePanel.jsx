import React, { useMemo } from 'react'
import { getDispositionLabel, todayISO, uid } from '../utils'
import { useLanguage } from '../i18n.jsx'

const DISPOSITION_ACTIONS = {
  renew: ['ok', 'bad'],
  return: ['return'],
}

export default function RepairQueuePanel({ db, setDb, companyId }){
  const { t, formatDateTime } = useLanguage()
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
    const supportedActions = DISPOSITION_ACTIONS[entry.disposition]
    if(supportedActions && !supportedActions.includes(action)) return
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
    if((action==='bad' || action==='return' || action==='ok') && entry.itemId){
      const type = action==='bad' ? 'dispose' : action==='return' ? 'return' : 'renew'
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
      <div className="header">{t('repairQueue.title')}</div>
      <div className="body inventory-table">
        <table>
          <thead>
            <tr>
              <th>{t('repairQueue.columns.date')}</th>
              <th>{t('repairQueue.columns.job')}</th>
              <th>{t('repairQueue.columns.part')}</th>
              <th>{t('repairQueue.columns.sku')}</th>
              <th>{t('repairQueue.columns.qty')}</th>
              <th>{t('repairQueue.columns.disposition')}</th>
              <th>{t('repairQueue.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {repairQueue.length===0 ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:'16px'}} className="dim">{t('repairQueue.empty')}</td></tr>
            ) : repairQueue
              .slice()
              .sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
              .map(item => {
                const job = jobMap.get(item.jobId)
                return (
                  <tr key={item.id}>
                    <td>{item.createdAt ? (formatDateTime(item.createdAt) || new Date(item.createdAt).toLocaleString()) : '—'}</td>
                    <td>{job ? job.orderNumber : '—'}</td>
                    <td>{item.name}</td>
                    <td>{item.sku}</td>
                    <td>{item.qty}</td>
                    <td>{getDispositionLabel(item.disposition, t)}</td>
                    <td>
                      <div className="row-actions">
                        {item.disposition === 'renew' && (
                          <>
                            <button className="btn" onClick={()=>queueOk(item.id)} disabled={!item.itemId}>{t('repairQueue.actions.ok')}</button>
                            <button className="btn danger" onClick={()=>queueBad(item.id)}>{t('repairQueue.actions.bad')}</button>
                          </>
                        )}
                        {item.disposition === 'return' && (
                          <button className="btn" onClick={()=>queueReturn(item.id)}>{t('repairQueue.actions.return')}</button>
                        )}
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
