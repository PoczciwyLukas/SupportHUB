import React, { useEffect, useMemo, useState } from 'react'
import { loadDb, migrate, saveDb } from './utils'
import CompanySwitcher from './components/CompanySwitcher.jsx'
import ImportExport from './components/ImportExport.jsx'
import JobsPanel from './components/JobsPanel.jsx'
import InventoryPanel from './components/InventoryPanel.jsx'
import ReportsPanel from './components/ReportsPanel.jsx'
import { useLanguage } from './i18n.jsx'

export default function App(){
  const { t, lang, toggleLanguage } = useLanguage()
  const [db, setDb] = useState(()=> migrate(loadDb(false, lang)))
  const [tab, setTab] = useState("jobs")
  const [companyId, setCompanyId] = useState(db.companies[0]?.id || "")

  useEffect(()=>saveDb(db), [db])
  useEffect(()=>{ if (!companyId && db.companies[0]) setCompanyId(db.companies[0].id) }, [db, companyId])

  const company = useMemo(()=> db.companies.find(c=>c.id===companyId) || null, [db, companyId])
  const jobs = useMemo(()=> db.jobs.filter(j=>j.companyId===companyId), [db, companyId])
  const partEvents = useMemo(
    () => (Array.isArray(db.partEvents) ? db.partEvents : []).filter(e => e.companyId === companyId),
    [db, companyId]
  )

  const nextLanguage = lang === 'pl' ? 'en' : 'pl'
  const toggleLabel = t('app.languageToggle.aria', { language: t(`common.languageNames.${nextLanguage}`) })

  return (
    <div>
      <header>
        <div className="container bar">
          <div className="brand">
            <div className="logo"></div>
            <div>
              <div style={{fontWeight:700}}>{t('app.title')}</div>
              <div className="muted" style={{fontSize:12}}>{t('app.subtitle')}</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button
              type="button"
              className="btn"
              onClick={toggleLanguage}
              title={toggleLabel}
              aria-label={toggleLabel}
            >
              <span style={{fontWeight: lang === 'pl' ? 700 : 400}}>{t('common.languageShort.pl')}</span>
              <span style={{opacity:0.6}}> / </span>
              <span style={{fontWeight: lang === 'en' ? 700 : 400}}>{t('common.languageShort.en')}</span>
            </button>
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
              <button className={"btn " + (tab==="jobs"?"primary":"")} onClick={()=>setTab("jobs")}>
                {t('app.tabs.jobs')}
              </button>
              <button className={"btn " + (tab==="inv"?"primary":"")} onClick={()=>setTab("inv")}>
                {t('app.tabs.inventory')}
              </button>
              <button className={"btn " + (tab==="rep"?"primary":"")} onClick={()=>setTab("rep")}>
                {t('app.tabs.reports')}
              </button>
            </div>

            {tab==="jobs" && <JobsPanel db={db} setDb={setDb} companyId={companyId} />}
            {tab==="inv" && <InventoryPanel db={db} setDb={setDb} companyId={companyId} />}
            {tab==="rep" && <ReportsPanel jobs={jobs} partEvents={partEvents} />}
          </>
        )}
        <div className="muted" style={{fontSize:12, padding:'12px 0 36px'}}>{t('app.footerNotice')}</div>
      </main>
    </div>
  )
}

function EmptyState({ setDb }){
  const { t, lang } = useLanguage()
  function loadDemo(){
    const demo = loadDb(true, lang)
    saveDb(demo)
    setDb(migrate(demo))
  }
  return (
    <div className="card" style={{maxWidth:560, margin:'24px auto', textAlign:'center'}}>
      <div className="body">
        <h2>{t('emptyState.title')}</h2>
        <p className="muted">{t('emptyState.description')}</p>
        <button className="btn" onClick={loadDemo}>{t('emptyState.loadDemo')}</button>
      </div>
    </div>
  )
}
