import { getStoredLanguage, translate } from './i18n.jsx'

export const STORAGE_KEY = "serwis-manager-vite-v1"

const STATUS_DEFS = [
  { value: "nowe", labelKey: "common.statuses.nowe" },
  { value: "wtrakcie", labelKey: "common.statuses.wtrakcie" },
  { value: "czeka", labelKey: "common.statuses.czeka" },
  { value: "zakonczone", labelKey: "common.statuses.zakonczone" },
  { value: "odeslane", labelKey: "common.statuses.odeslane" },
]

const JOB_TYPE_DEFS = [
  { value: "hub", labelKey: "common.jobTypes.hub" },
  { value: "onsite", labelKey: "common.jobTypes.onsite" },
  { value: "upgrade", labelKey: "common.jobTypes.upgrade" },
]

const DISPOSITION_DEFS = [
  { value: "keep", labelKey: "common.dispositions.keep" },
  { value: "dispose", labelKey: "common.dispositions.dispose" },
  { value: "renew", labelKey: "common.dispositions.renew" },
  { value: "return", labelKey: "common.dispositions.return" },
]

function resolveTranslator(resolver){
  if (typeof resolver === 'function') return resolver
  const lang = typeof resolver === 'string' && resolver ? resolver : getStoredLanguage()
  return (key, replacements) => translate(lang, key, replacements)
}

export function getDefaultStatuses(resolver){
  const t = resolveTranslator(resolver)
  return STATUS_DEFS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))
}

export function getJobTypes(resolver){
  const t = resolveTranslator(resolver)
  return JOB_TYPE_DEFS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))
}

export function getDispositionOptions(resolver){
  const t = resolveTranslator(resolver)
  return DISPOSITION_DEFS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))
}

export function getDispositionLabel(value, resolver){
  const t = resolveTranslator(resolver)
  const entry = DISPOSITION_DEFS.find(d => d.value === value)
  return entry ? t(entry.labelKey) : value
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id_" + Date.now() + "_" + Math.random().toString(36).slice(2,8))
export const todayISO = () => new Date().toISOString()
export const ensureUrlOrSearch = (s) => {
  if (!s) return null
  const v = String(s).trim()
  if (/^https?:\/\//i.test(v)) return v
  return "https://www.google.com/search?q=" + encodeURIComponent(v)
}
export const isOverdue = (d) => d ? (new Date() > new Date(d + "T23:59:59")) : false

export function loadDb(withDemo=false, lang){
  const createEmptyDb = () => ({
    companies: [],
    jobs: [],
    inventory: [],
    repairQueue: [],
    partEvents: [],
  })
  const language = typeof lang === 'string' && lang ? lang : getStoredLanguage()
  const t = resolveTranslator(language)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && !withDemo) return JSON.parse(raw)
  } catch {}
  const c1 = { id: uid(), name: t('demo.companies.first'), createdAt: todayISO() }
  const c2 = { id: uid(), name: t('demo.companies.second'), createdAt: todayISO() }
  const demo = {
    ...createEmptyDb(),
    companies: [c1, c2],
    jobs: [
      {
        id: uid(),
        companyId: c1.id,
        orderNumber: t('demo.jobs.first.orderNumber'),
        serialNumber: t('demo.jobs.first.serialNumber'),
        issueDesc: t('demo.jobs.first.issue'),
        incomingTracking: "DHL-123",
        outgoingTracking: "",
        actionsDesc: t('demo.jobs.first.actions'),
        status:"wtrakcie",
        jobType:"hub",
        dueDate: new Date().toISOString().slice(0,10),
        shipIn:85,
        shipOut:95,
        insIn:12,
        insOut:15,
        createdAt: todayISO(),
        updatedAt: todayISO(),
        inventoryUsed: [],
      },
      {
        id: uid(),
        companyId: c1.id,
        orderNumber: t('demo.jobs.second.orderNumber'),
        serialNumber: t('demo.jobs.second.serialNumber'),
        issueDesc: t('demo.jobs.second.issue'),
        incomingTracking: "INPOST-XYZ",
        outgoingTracking: "",
        actionsDesc: t('demo.jobs.second.actions'),
        status:"czeka",
        jobType:"onsite",
        dueDate:"",
        shipIn:0,
        shipOut:0,
        insIn:0,
        insOut:0,
        createdAt: todayISO(),
        updatedAt: todayISO(),
        inventoryUsed: [],
      },
    ],
    inventory: [
      { id: uid(), companyId: c1.id, sku:"KND-100", name:t('demo.inventory.capacitor'), qty:12, location:"A1", minQty:5, createdAt: todayISO()},
      { id: uid(), companyId: c1.id, sku:"PSU-12V", name:t('demo.inventory.psu'), qty:3, location:"B2", minQty:2, createdAt: todayISO()},
    ],
  }
  return withDemo ? demo : createEmptyDb()
}

export function saveDb(db){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)) } catch {} }

export function migrate(data){
  const jobs = (data.jobs||[]).map(j => ({
    ...j,
    jobType: j.jobType || "hub",
    shipIn: Number(j.shipIn||0), shipOut: Number(j.shipOut||0),
    insIn: Number(j.insIn||0), insOut: Number(j.insOut||0),
    inventoryUsed: (j.inventoryUsed||[]).map(u => ({
      ...u,
      qty: Number(u.qty||0),
      disposition: ["dispose", "renew", "return"].includes(u.disposition)
        ? u.disposition
        : "renew",
    })),
  }))
  const inventory = (data.inventory||[]).map(({ toReturnUSA, ...i }) => ({ ...i }))
  const jobMap = new Map(jobs.map(j => [j.id, j]))
  const repairQueue = (data.repairQueue||[]).map(r => {
    const job = r.jobId ? jobMap.get(r.jobId) : null
    const companyId = r.companyId || job?.companyId || null
    if(!companyId) return null
    return {
      ...r,
      id: r.id || uid(),
      companyId,
      jobId: r.jobId || null,
      itemId: r.itemId || r.inventoryItemId || null,
      name: r.name || "",
      sku: r.sku || "",
      qty: Number(r.qty||0),
      disposition: ["dispose", "renew", "return"].includes(r.disposition)
        ? r.disposition
        : "renew",
      createdAt: r.createdAt || r.addedAt || todayISO(),
    }
  }).filter(Boolean)
  const partEvents = (data.partEvents||[]).map(ev => {
    const job = ev.jobId ? jobMap.get(ev.jobId) : null
    const companyId = ev.companyId || job?.companyId || null
    if(!companyId) return null
    const rawType = ev.type || ev.eventType || ev.disposition
    const type = rawType === 'return' ? 'return' : rawType === 'renew' ? 'renew' : 'dispose'
    return {
      id: ev.id || uid(),
      companyId,
      jobId: ev.jobId || null,
      itemId: ev.itemId || null,
      sku: ev.sku || "",
      name: ev.name || "",
      qty: Number(ev.qty||0),
      type,
      eventDate: ev.eventDate || ev.date || ev.createdAt || todayISO(),
    }
  }).filter(Boolean)
  return {
    companies: data.companies||[],
    jobs,
    inventory,
    repairQueue: repairQueue.length ? repairQueue : (data.repairQueue || []),
    partEvents: partEvents.length ? partEvents : (data.partEvents || []),
  }
}
