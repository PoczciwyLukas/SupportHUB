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
      { id: uid(), companyId: c1.id, sku:"KND-100", name:"Kondensator 100uF", qty:12, location:"A1", minQty:5, toReturnUSA:false, createdAt: todayISO()},
      { id: uid(), companyId: c1.id, sku:"PSU-12V", name:"Zasilacz 12V", qty:3, location:"B2", minQty:2, toReturnUSA:true, createdAt: todayISO()},
    ],
  }
  return withDemo ? demo : { companies: [], jobs: [], inventory: [] }
}

export function saveDb(db){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)) } catch {} }

export function migrate(data){
  const jobs = (data.jobs||[]).map(j => ({
    ...j,
    jobType: j.jobType || "hub",
    shipIn: Number(j.shipIn||0), shipOut: Number(j.shipOut||0),
    insIn: Number(j.insIn||0), insOut: Number(j.insOut||0),
    inventoryUsed: (j.inventoryUsed||[]).map(u => ({...u, qty: Number(u.qty||0), disposition: u.disposition || "keep"})),
  }))
  const inventory = (data.inventory||[]).map(i => ({...i, toReturnUSA: !!i.toReturnUSA}))
  return { companies: data.companies||[], jobs, inventory }
}
