
import React from 'react'
import JobsPanel from './components_remote/JobsPanelRemote.jsx'
import InventoryPanel from './components_remote/InventoryPanelRemote.jsx'
import ReportsPanel from './components_remote/ReportsPanelRemote.jsx'

export default function App(){
  const [tab, setTab] = React.useState('jobs')
  return (
    <div className="container">
      <div className="tabs">
        <button className={`btn ${tab==='jobs'?'active':''}`} onClick={()=>setTab('jobs')}>Zlecenia</button>
        <button className={`btn ${tab==='inventory'?'active':''}`} onClick={()=>setTab('inventory')}>Magazyn</button>
        <button className={`btn ${tab==='reports'?'active':''}`} onClick={()=>setTab('reports')}>Raport</button>
      </div>
      {tab==='jobs' && <JobsPanel/>}
      {tab==='inventory' && <InventoryPanel/>}
      {tab==='reports' && <ReportsPanel/>}
    </div>
  )
}
