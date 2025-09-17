import React, { useMemo, useState } from 'react'
import {
  getDefaultStatuses,
  getDispositionLabel,
  getDispositionOptions,
  getJobTypes,
} from '../utils'
import { useLanguage } from '../i18n.jsx'

export default function ReportsPanel({ jobs, partEvents }){
  const { t, formatCurrency, formatDate, formatDateTime } = useLanguage()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [activeModal, setActiveModal] = useState(null)

  const statuses = useMemo(() => getDefaultStatuses(t), [t])
  const jobTypes = useMemo(() => getJobTypes(t), [t])
  const dispositions = useMemo(() => getDispositionOptions(t), [t])
  const statusMap = useMemo(() => new Map(statuses.map(s => [s.value, s.label])), [statuses])
  const jobTypeMap = useMemo(() => new Map(jobTypes.map(s => [s.value, s.label])), [jobTypes])
  const dispositionMap = useMemo(() => new Map(dispositions.map(d => [d.value, d.label])), [dispositions])

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
    const tMax = to ? new Date(to + "T23:59:59").getTime() : Infinity
    return jobs.filter(j => {
      const ts = new Date(j.createdAt).getTime()
      return ts >= f && ts <= tMax
    })
  }, [jobs, from, to])

  const eventsInRange = useMemo(()=>{
    const f = from ? new Date(from + "T00:00:00").getTime() : -Infinity
    const tMax = to ? new Date(to + "T23:59:59").getTime() : Infinity
    return scopedPartEvents.filter(e => {
      const ts = new Date(e.eventDate).getTime()
      return ts >= f && ts <= tMax
    })
  }, [scopedPartEvents, from, to])

  const jobStatusGroups = useMemo(() => {
    const groups = statuses.reduce((acc, status) => {
      acc[status.value] = []
      return acc
    }, {})
    for (const job of jobsInRange) {
      const key = job.status || 'unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(job)
    }
    return groups
  }, [jobsInRange, statuses])

  const jobTypeGroups = useMemo(() => {
    const groups = jobTypes.reduce((acc, type) => {
      acc[type.value] = []
      return acc
    }, {})
    for (const job of jobsInRange) {
      const key = job.jobType || 'hub'
      if (!groups[key]) groups[key] = []
      groups[key].push(job)
    }
    return groups
  }, [jobsInRange, jobTypes])

  const totalJobs = jobsInRange.length
  const byStatus = useMemo(() => (
    statuses.map(s => ({
      status: s.value,
      label: s.label,
      count: (jobStatusGroups[s.value] || []).length
    }))
  ), [statuses, jobStatusGroups])
  const byType = useMemo(() => (
    jobTypes.map(tpl => ({
      type: tpl.value,
      label: tpl.label,
      count: (jobTypeGroups[tpl.value] || []).length
    }))
  ), [jobTypes, jobTypeGroups])

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
      const source = activeModal.mode === 'status'
        ? (jobStatusGroups[activeModal.filter] || [])
        : (jobTypeGroups[activeModal.filter] || [])
      const items = source.map(job => {
        const jobStatusLabel = statusMap.get(job.status) || job.status || t('reports.modal.jobNoStatus')
        const jobTypeLabel = jobTypeMap.get(job.jobType || 'hub') || job.jobType || 'hub'
        const createdAt = job.createdAt ? (formatDateTime(job.createdAt) || formatDateTime(new Date(job.createdAt))) : ''
        const subtitle = [
          t('reports.modal.jobStatusPrefix', { status: jobStatusLabel }),
          t('reports.modal.jobTypePrefix', { type: jobTypeLabel })
        ].join(' • ')
        return {
          id: job.id,
          title: job.orderNumber || job.serialNumber || t('reports.modal.jobFallbackTitle', { id: job.id }),
          subtitle,
          meta: createdAt ? t('reports.modal.jobCreatedAt', { date: createdAt }) : null,
        }
      })
      return {
        title: t('reports.modal.jobsTitle', { label: activeModal.label }),
        items,
      }
    }

    if (activeModal.section === 'parts') {
      if (activeModal.mode === 'usage') {
        const usageItems = (usageByDisposition[activeModal.filter] || []).map((usage, idx) => {
          const relatedJob = jobMap.get(usage.jobId)
          const jobLabel = relatedJob?.orderNumber || usage.orderNumber || relatedJob?.serialNumber || usage.jobId
          const createdAt = usage.jobCreatedAt ? (formatDate(usage.jobCreatedAt) || formatDate(new Date(usage.jobCreatedAt))) : ''
          const dispositionLabel = dispositionMap.get(usage.disposition) || getDispositionLabel(usage.disposition, t)
          const metaParts = [
            jobLabel ? t('reports.modal.partJob', { job: jobLabel }) : null,
            createdAt ? t('reports.modal.partDate', { date: createdAt }) : null,
          ].filter(Boolean)
          return {
            id: `${usage.itemId || usage.sku || idx}-${usage.jobId || idx}-${usage.disposition}`,
            title: usage.name || usage.sku || t('reports.modal.partUnknown'),
            subtitle: `${t('reports.modal.partQty', { qty: usage.qty })} • ${t('reports.modal.partDisposition', { label: dispositionLabel })}`,
            meta: metaParts.join(' • ') || null,
          }
        })
        return {
          title: t('reports.modal.partsTitle', { label: activeModal.label }),
          items: usageItems,
        }
      }
      if (activeModal.mode === 'event') {
        const eventItems = (eventsByType[activeModal.filter] || []).map(event => {
          const relatedJob = event.jobId ? jobMap.get(event.jobId) : null
          const jobLabel = relatedJob?.orderNumber || relatedJob?.serialNumber || event.jobId
          const dateLabel = event.eventDate ? (formatDateTime(event.eventDate) || formatDateTime(new Date(event.eventDate))) : ''
          const metaParts = [
            jobLabel ? t('reports.modal.partJob', { job: jobLabel }) : null,
            dateLabel ? t('reports.modal.partDate', { date: dateLabel }) : null,
          ].filter(Boolean)
          return {
            id: event.id,
            title: event.name || event.sku || t('reports.modal.partUnknown'),
            subtitle: t('reports.modal.partQty', { qty: event.qty }),
            meta: metaParts.join(' • ') || null,
          }
        })
        return {
          title: t('reports.modal.partsTitle', { label: activeModal.label }),
          items: eventItems,
        }
      }
    }

    return { title: activeModal.label || '', items: [] }
  }, [activeModal, eventsByType, jobMap, jobStatusGroups, jobTypeGroups, usageByDisposition, statusMap, jobTypeMap, dispositionMap, formatDate, formatDateTime, t])

  const handleCardKeyDown = (event, payload) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setActiveModal(payload)
    }
  }

  const keptLabel = dispositionMap.get('keep') || getDispositionLabel('keep', t)
  const disposedLabel = dispositionMap.get('dispose') || getDispositionLabel('dispose', t)

  return (
    <div className="dashboard-grid">
      <div className="card dashboard-grid__full">
        <div className="header">{t('reports.dateRangeTitle')}</div>
        <div className="body grid col-2">
          <div>
            <div className="label">{t('reports.fromLabel')}</div>
            <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div>
            <div className="label">{t('reports.toLabel')}</div>
            <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="header">{t('reports.jobsSummaryTitle')}</div>
        <div className="body">
          <div>{t('reports.jobsSummary.totalPrefix')} <strong>{totalJobs}</strong></div>
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
            {byType.map(tpl => (
              <div
                key={tpl.type}
                className="card card--actionable"
                role="button"
                tabIndex={0}
                onClick={() => setActiveModal({ section: 'jobs', mode: 'type', label: tpl.label, filter: tpl.type })}
                onKeyDown={event => handleCardKeyDown(event, { section: 'jobs', mode: 'type', label: tpl.label, filter: tpl.type })}
              >
                <div className="body">
                  <div className="dim" style={{fontSize:12}}>{tpl.label}</div>
                  <div style={{fontSize:24, fontWeight:700}}>{tpl.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="header">{t('reports.partsSummaryTitle')}</div>
        <div className="body">
          <div>{t('reports.partsSummary.totalPrefix')} <strong>{totalParts}</strong></div>
          <div className="summary-grid summary-grid--auto summary-grid--spaced">
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'usage', label: keptLabel, filter: 'keep' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'usage', label: keptLabel, filter: 'keep' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>{keptLabel}</div>
                <div style={{fontSize:24, fontWeight:700}}>{keptParts}</div>
              </div>
            </div>
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'usage', label: disposedLabel, filter: 'dispose' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'usage', label: disposedLabel, filter: 'dispose' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>{disposedLabel}</div>
                <div style={{fontSize:24, fontWeight:700}}>{disposedParts}</div>
              </div>
            </div>
          </div>
          <div className="summary-grid summary-grid--auto summary-grid--spaced">
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'event', label: t('reports.partsSummary.disposalEventsLabel'), filter: 'dispose' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'event', label: t('reports.partsSummary.disposalEventsLabel'), filter: 'dispose' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>{t('reports.partsSummary.disposalEventsLabel')}</div>
                <div style={{fontSize:24, fontWeight:700}}>{disposedEvents}</div>
              </div>
            </div>
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'event', label: t('reports.partsSummary.returnEventsLabel'), filter: 'return' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'event', label: t('reports.partsSummary.returnEventsLabel'), filter: 'return' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>{t('reports.partsSummary.returnEventsLabel')}</div>
                <div style={{fontSize:24, fontWeight:700}}>{returnedEvents}</div>
              </div>
            </div>
            <div
              className="card card--actionable"
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal({ section: 'parts', mode: 'event', label: t('reports.partsSummary.renewEventsLabel'), filter: 'renew' })}
              onKeyDown={event => handleCardKeyDown(event, { section: 'parts', mode: 'event', label: t('reports.partsSummary.renewEventsLabel'), filter: 'renew' })}
            >
              <div className="body">
                <div className="dim" style={{fontSize:12}}>{t('reports.partsSummary.renewEventsLabel')}</div>
                <div style={{fontSize:24, fontWeight:700}}>{renewEventsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card dashboard-grid__full">
        <div className="header">{t('reports.shipmentsTitle')}</div>
        <div className="body" style={{fontSize:14}}>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>{t('reports.shipments.shipmentLabel')}</div><div style={{fontSize:20, fontWeight:700}}>{formatCurrency(shipmentSum)}</div></div></div>
            <div className="card"><div className="body"><div className="dim" style={{fontSize:12}}>{t('reports.shipments.insuranceLabel')}</div><div style={{fontSize:20, fontWeight:700}}>{formatCurrency(insuranceSum)}</div></div></div>
          </div>
          <div style={{marginTop:8}}>{t('reports.shipments.totalLabel')} <strong>{formatCurrency(shipTotal)}</strong></div>
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
                <div className="dim" style={{textAlign:'center'}}>{t('reports.modal.noResults')}</div>
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
              <button className="btn" onClick={closeModal}>{t('reports.modal.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

