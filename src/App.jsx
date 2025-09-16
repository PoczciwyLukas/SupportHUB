import React, { useEffect, useMemo, useState } from 'react'
import { ensureUrlOrSearch, fmtPLN, loadDb, migrate, saveDb, todayISO } from './utils'
import CompanySwitcher from './components/CompanySwitcher.jsx'
import ImportExport from './components/ImportExport.jsx'
import JobsPanel from './components/JobsPanel.jsx'
import InventoryPanel from './components/InventoryPanel.jsx'
import ReportsPanel from './components/ReportsPanel.jsx'

export default function App(){
  const [db, setDb] = useState(()=> migrate(loadDb()))
  const [tab, setTab] = useState("jobs")
  const [companyId, setCompanyId] = useState(db.companies[0]?.id || "")

  useEffect(()=>saveDb(db), [db])
  useEffect(()=>{ if (!companyId && db.companies[0]) setCompanyId(db.companies[0].id) }, [db, companyId])

  const company = useMemo(()=> db.companies.find(c=>c.id===companyId) || null, [db, companyId])
  const jobs = useMemo(()=> db.jobs.filter(j=>j.companyId===companyId), [db, companyId])
  const partEvents = useMemo(()=> db.partEvents.filter(e=>e.companyId===companyId), [db, companyId])

  return (
    <div>
      <header>
        <div className="container bar">
          <div className="brand">
            <div className="logo"></div>
            <div>
              <div style={{fontWeight:700}}>Serwis Manager</div>
              <div className="muted" style={{fontSize:12}}>Zlecenia • Magazyn • Raporty</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <CompanySwitcher db={db} setDb={setDb} companyId={companyId} setCompanyId={setCompanyId} />
            <ImportExport db={db} setDb={setDb} />
          </div>
        </div>
      </header>

      <main className="container">
        {!company ? (
          <EmptyState setDb={setDb} />
        ) : (
          <>
            <div className="tabs">
              <button className={"btn " + (tab==="jobs"?"primary":"")} onClick={()=>setTab("jobs")}>Zlecenia</button>
              <button className={"btn " + (tab==="inv"?"primary":"")} onClick={()=>setTab("inv")}>Magazyn</button>
              <button className={"btn " + (tab==="rep"?"primary":"")} onClick={()=>setTab("rep")}>Raport</button>
            </div>

            {tab==="jobs" && <JobsPanel db={db} setDb={setDb} companyId={companyId} />}
            {tab==="inv" && <InventoryPanel db={db} setDb={setDb} companyId={companyId} />}
            {tab==="rep" && <ReportsPanel jobs={jobs} partEvents={partEvents} />}
          </>
        )}
        <div className="muted" style={{fontSize:12, padding:'12px 0 36px'}}>Dane lokalnie w przeglądarce. Import/Export = kopia/przenoszenie.</div>
      </main>
    </div>
  )
}

function EmptyState({ setDb }){
  function loadDemo(){
    const demo = loadDb(true)
    saveDb(demo)
    setDb(migrate(demo))
  }
  return (
    <div className="card" style={{maxWidth:560, margin:'24px auto', textAlign:'center'}}>
      <div className="body">
        <h2>Zacznij od dodania firmy</h2>
        <p className="muted">Aplikacja gotowa do pracy. Dodaj firmę, a potem twórz zlecenia i zarządzaj magazynem.</p>
        <button className="btn" onClick={loadDemo}>Wczytaj dane przykładowe</button>
      </div>
    </div>
  )
}
