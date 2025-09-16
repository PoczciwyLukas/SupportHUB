export const STORAGE_KEY = "serwis-manager-vite-v1"

export const DEFAULT_STATUSES = [
  { value: "nowe", label: "Nowe" },
  { value: "wtrakcie", label: "W trakcie" },
  { value: "czeka", label: "Czeka na części" },
  { value: "zakonczone", label: "Zakończone" },
  { value: "odeslane", label: "Odesłane" },
]

export const JOB_TYPES = [
  { value: "hub", label: "Naprawa w hubie" },
  { value: "onsite", label: "Naprawa u klienta" },
  { value: "upgrade", label: "Upgrade" },
]

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id_" + Date.now() + "_" + Math.random().toString(36).slice(2,8))
export const todayISO = () => new Date().toISOString()
export const ensureUrlOrSearch = (s) => {
  if (!s) return null
  const v = String(s).trim()
  if (/^https?:\/\//i.test(v)) return v
  return "https://www.google.com/search?q=" + encodeURIComponent(v)
}
export const fmtPLN = (n) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(Number(n||0))
export const isOverdue = (d) => d ? (new Date() > new Date(d + "T23:59:59")) : false

export function loadDb(withDemo=false){
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && !withDemo) return JSON.parse(raw)
  } catch {}
  const c1 = { id: uid(), name: "Firma A", createdAt: todayISO() }
  const c2 = { id: uid(), name: "Firma B", createdAt: todayISO() }
  const demo = {
    companies: [c1, c2],
    jobs: [
      { id: uid(), companyId: c1.id, orderNumber: "ZL-2025-001", serialNumber:"SN12345", issueDesc:"Nie włącza się", incomingTracking:"DHL-123", outgoingTracking:"", actionsDesc:"Diagnoza zasilania", status:"wtrakcie", jobType:"hub", dueDate: new Date().toISOString().slice(0,10), shipIn:85, shipOut:95, insIn:12, insOut:15, createdAt: todayISO(), updatedAt: todayISO(), inventoryUsed: []},
      { id: uid(), companyId: c1.id, orderNumber: "ZL-2025-002", serialNumber:"SN55555", issueDesc:"Brak obrazu", incomingTracking:"INPOST-XYZ", outgoingTracking:"", actionsDesc:"Wymiana kondensatora", status:"czeka", jobType:"onsite", dueDate:"", shipIn:0, shipOut:0, insIn:0, insOut:0, createdAt: todayISO(), updatedAt: todayISO(), inventoryUsed: []},
    ],
    inventory: [
      { id: uid(), companyId: c1.id, sku:"KND-100", name:"Kondensator 100uF", qty:12, location:"A1", minQty:5, createdAt: todayISO()},
      { id: uid(), companyId: c1.id, sku:"PSU-12V", name:"Zasilacz 12V", qty:3, location:"B2", minQty:2, createdAt: todayISO()},
    ],
    repairQueue: [],
    partEvents: [],
  }
  return withDemo ? demo : { companies: [], jobs: [], inventory: [], repairQueue: [], partEvents: [] }
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
    const type = rawType === 'return' ? 'return' : 'dispose'
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
