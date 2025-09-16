import React, { useMemo, useState } from 'react'
import { DEFAULT_STATUSES, JOB_TYPES, fmtPLN } from '../utils'

const DISPOSITION_LABELS = {
  keep: 'pozostaje u mnie',
  dispose: 'utylizacja',
  renew: 'odnowienie',
  return: 'odesłanie do producenta',
}

export default function ReportsPanel({ jobs, partEvents }){
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [activeModal, setActiveModal] = useState(null)

  const closeModal = () => setActiveModal(null)

  const scopedPartEvents = useMemo(
    () => (Array.isArray(partEvents) ? partEvents : []),
    [partEvents]
  )

  const jobMap = useMemo(() => {
    const map = new Map()
    for (const job of jobs) {
      map.set(job.id, job)
    }
    return map
  }, [jobs])

  const jobsInRange = useMemo(()=>{
    const f = from ? new Date(from + "T00:00:00").getTime() : -Infinity
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity
    return jobs.filter(j => {
      const ts = new Date(j.createdAt).getTime()
      return ts >= f && ts <= t
    })
  }, [jobs, from, to])

  const eventsInRange = useMemo(()=>{
    const f = from ? new Date(from + "T00:00:00").getTime() : -Infinity
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity
    return scopedPartEvents.filter(e => {
      const ts = new Date(e.eventDate).getTime()
      return ts >= f && ts <= t
    })
  }, [scopedPartEvents, from, to])

  const jobStatusGroups = useMemo(() => {
    const groups = DEFAULT_STATUSES.reduce((acc, status) => {
      acc[status.value] = []
      return acc
    }, {})
    for (const job of jobsInRange) {
      const key = job.status || 'unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(job)
    }
    return groups
  }, [jobsInRange])

  const jobTypeGroups = useMemo(() => {
    const groups = JOB_TYPES.reduce((acc, type) => {
      acc[type.value] = []
      return acc
    }, {})
    for (const job of jobsInRange) {
      const key = job.jobType || 'hub'
      if (!groups[key]) groups[key] = []
      groups[key].push(job)
    }
    return groups
  }, [jobsInRange])

  const totalJobs = jobsInRange.length
  const byStatus = useMemo(() => (
    DEFAULT_STATUSES.map(s => ({
      status: s.value,
      label: s.label,
      count: (jobStatusGroups[s.value] || []).length
    }))
  ), [jobStatusGroups])
  const byType = useMemo(() => (
    JOB_TYPES.map(t => ({
      type: t.value,
      label: t.label,
      count: (jobTypeGroups[t.value] || []).length
    }))
  ), [jobTypeGroups])

  const allUsages = useMemo(() => (
    jobsInRange.flatMap(job => (job.inventoryUsed || []).map(u => ({
      ...u,
      jobId: job.id,
      orderNumber: job.orderNumber,
      jobStatus: job.status,
      jobType: job.jobType || 'hub',
      jobCreatedAt: job.createdAt,
    })))
  ), [jobsInRange])

  const usageByDisposition = useMemo(() => (
    allUsages.reduce((acc, usage) => {
      const key = usage.disposition || 'renew'
      if (!acc[key]) acc[key] = []
      acc[key].push(usage)
      return acc
    }, {})
  ), [allUsages])

  const totalParts = useMemo(() => (
    allUsages.reduce((a,u)=>a+Number(u.qty||0),0)
  ), [allUsages])
  const keptParts = useMemo(() => (
    (usageByDisposition.keep || []).reduce((a,u)=>a+Number(u.qty||0),0)
  ), [usageByDisposition])
  const disposedParts = useMemo(() => (
    (usageByDisposition.dispose || []).reduce((a,u)=>a+Number(u.qty||0),0)
  ), [usageByDisposition])

  const eventsByType = useMemo(() => (
    eventsInRange.reduce((acc, ev) => {
      const key = ev.type || 'renew'
      if (!acc[key]) acc[key] = []
      acc[key].push(ev)
      return acc
    }, {})
  ), [eventsInRange])

  const disposedEvents = useMemo(() => (
    (eventsByType.dispose || []).reduce((a,e)=>a+Number(e.qty||0),0)
  ), [eventsByType])
  const returnedEvents = useMemo(() => (
    (eventsByType.return || []).reduce((a,e)=>a+Number(e.qty||0),0)
  ), [eventsByType])
  const renewEventsCount = useMemo(() => (
    (eventsByType.renew || []).length
  ), [eventsByType])

  const shipInSum = jobsInRange.reduce((s,j)=> s + Number(j.shipIn||0), 0)
  const shipOutSum = jobsInRange.reduce((s,j)=> s + Number(j.shipOut||0), 0)
  const insInSum = jobsInRange.reduce((s,j)=> s + Number(j.insIn||0), 0)
  const insOutSum = jobsInRange.reduce((s,j)=> s + Number(j.insOut||0), 0)
  const shipmentSum = shipInSum + shipOutSum
  const insuranceSum = insInSum + insOutSum
  const shipTotal = shipmentSum + insuranceSum

  const modalData = useMemo(() => {
    if (!activeModal) return { title: '', items: [] }

    if (activeModal.section === 'jobs') {
      const statusLabelMap = DEFAULT_STATUSES.reduce((acc, status) => {
        acc[status.value] = status.label
        return acc
      }, {})
      const typeLabelMap = JOB_TYPES.reduce((acc, type) => {
        acc[type.value] = type.label
        return acc
      }, {})
      const source = activeModal.mode === 'status'
        ? (jobStatusGroups[activeModal.filter] || [])
        : (jobTypeGroups[activeModal.filter] || [])
      const items = source.map(job => {
        const jobStatusLabel = statusLabelMap[job.status] || job.status || 'Brak statusu'
        const jobTypeLabel = typeLabelMap[job.jobType || 'hub'] || job.jobType || 'hub'
        const createdAt = job.createdAt ? new Date(job.createdAt).toLocaleString('pl-PL') : 'Brak daty'
        const secondary = [`Status: ${jobStatusLabel}`, `Typ: ${jobTypeLabel}`].join(' • ')
        return {
          id: job.id,
          title: job.orderNumber || job.serialNumber || `Zlecenie ${job.id}`,
          subtitle: secondary,
          meta: `Utworzono: ${createdAt}`,
        }
      })
      return {
        title: `Zlecenia — ${activeModal.label}`,
        items,
      }
    }

    if (activeModal.section === 'parts') {
      if (activeModal.mode === 'usage') {
        const usageItems = (usageByDisposition[activeModal.filter] || []).map((usage, idx) => {
          const relatedJob = jobMap.get(usage.jobId)
          const jobLabel = relatedJob?.orderNumber || usage.orderNumber || relatedJob?.serialNumber || usage.jobId
          const createdAt = usage.jobCreatedAt ? new Date(usage.jobCreatedAt).toLocaleDateString('pl-PL') : null
          return {
            id: `${usage.itemId || usage.sku || idx}-${usage.jobId || idx}-${usage.disposition}`,
            title: usage.name || usage.sku || 'Nieznana część',
            subtitle: `Ilość: ${usage.qty} • Los: ${DISPOSITION_LABELS[usage.disposition] || usage.disposition}`,
            meta: jobLabel ? `Zlecenie: ${jobLabel}${createdAt ? ` • Data: ${createdAt}` : ''}` : null,
          }
        })
        return {
          title: `Części — ${activeModal.label}`,
          items: usageItems,
        }
      }
      if (activeModal.mode === 'event') {
        const eventItems = (eventsByType[activeModal.filter] || []).map(event => {
          const relatedJob = event.jobId ? jobMap.get(event.jobId) : null
          const jobLabel = relatedJob?.orderNumber || relatedJob?.serialNumber || event.jobId
          const dateLabel = event.eventDate ? new Date(event.eventDate).toLocaleString('pl-PL') : null
          return {
            id: event.id,
            title: event.name || event.sku || 'Nieznana część',
            subtitle: `Ilość: ${event.qty}`,
            meta: [jobLabel ? `Zlecenie: ${jobLabel}` : null, dateLabel ? `Data: ${dateLabel}` : null].filter(Boolean).join(' • ') || null,
          }
        })
        return {
          title: `Części — ${activeModal.label}`,
          items: eventItems,
        }
      }
    }

    return { title: activeModal.label || '', items: [] }
  }, [activeModal, eventsByType, jobMap, jobStatusGroups, jobTypeGroups, usageByDisposition])

  const handleCardKeyDown = (event, payload) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setActiveModal(payload)
    }
  }

  return (
    <div className="dashboard-grid">
      <div className="card dashboard-grid__full">
        <div className="header">Zakres dat</div>
        <div className="body grid col-2">
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
          <div className="summary-grid summary-grid--spaced">
            {byStatus.map(s => (
              <div
                key={s.status}
                className="card card--actionable"
                role="button"
                tabIndex={0}
                onClick={() => setActiveModal({ section: 'jobs', mode: 'status', label: s.label, filter: s.status })}
                onKeyDown={event => handleCardKeyDown(event, { section: 'jobs', mode: 'status', label: s.label, filter: s.status })}
              >
                <div className="body">
                  <div className="dim" style={{fontSize:12}}>{s.label}</div>
                  <div style={{fontSize:24, fontWeight:700}}>{s.count}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{height:1, background:'#e2e8f0', margin:'12px 0'}}></div>
          <div className="summary-grid summary-grid--spaced">
            {byType.map(t => (
              <div
                key={t.type}
                className="card card--actionable"
                role="button"
                tabIndex={0}
                onClick={() => setActiveModal({ section: 'jobs', mode: 'type', label: t.label, filter: t.type })}
                onKeyDown={event => handleCardKeyDown(event, { section: 'jobs', mode: 'type', label: t.label, filter: t.type })}
              >
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
          <div className="summary-grid summary-grid--auto summary-grid--spaced">
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'usage', label: 'Pozostały u mnie', filter: 'keep' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'usage', label: 'Pozostały u mnie', filter: 'keep' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Pozostały u mnie</div>
                <div style={{fontSize:24, fontWeight:700}}>{keptParts}</div>
              </div>
            </div>
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'usage', label: 'Utylizacja', filter: 'dispose' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'usage', label: 'Utylizacja', filter: 'dispose' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Utylizacja</div>
                <div style={{fontSize:24, fontWeight:700}}>{disposedParts}</div>
              </div>
            </div>
          </div>
          <div className="summary-grid summary-grid--auto summary-grid--spaced">
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'event', label: 'Utylizacje', filter: 'dispose' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'event', label: 'Utylizacje', filter: 'dispose' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Utylizacje</div>
                <div style={{fontSize:24, fontWeight:700}}>{disposedEvents}</div>
              </div>
            </div>
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'event', label: 'Odesłania', filter: 'return' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'event', label: 'Odesłania', filter: 'return' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Odesłania</div>
                <div style={{fontSize:24, fontWeight:700}}>{returnedEvents}</div>
              </div>
            </div>
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'event', label: 'Odnowienia', filter: 'renew' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'event', label: 'Odnowienia', filter: 'renew' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>Odnowienia (liczba pozycji)</div>
                <div style={{fontSize:24, fontWeight:700}}>{renewEventsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card dashboard-grid__full">
        <div className="header">Koszty przesyłek (PLN)</div>
        <div className="body" style={{fontSize:14}}>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>Przesyłka</div><div style={{fontSize:20, fontWeight:700}}>{fmtPLN(shipmentSum)}</div></div></div>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>Ubezpieczenie</div><div style={{fontSize:20, fontWeight:700}}>{fmtPLN(insuranceSum)}</div></div></div>
          </div>
          <div style={{marginTop:8}}>Razem: <strong>{fmtPLN(shipTotal)}</strong></div>
        </div>
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="card modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={modalData.title}
            onClick={event => event.stopPropagation()}
          >
            <div className="header">{modalData.title}</div>
            <div className="body">
              {modalData.items.length === 0 ? (
                <div className="dim" style={{textAlign:'center'}}>Brak wyników</div>
              ) : (
                <ul className="modal-list">
                  {modalData.items.map(item => (
                    <li key={item.id} className="modal-list__item">
                      <div className="modal-list__title">{item.title}</div>
                      {item.subtitle && <div className="modal-list__subtitle">{item.subtitle}</div>}
                      {item.meta && <div className="modal-list__meta">{item.meta}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
