import React, { useRef } from 'react'
import { migrate } from '../utils'

export default function ImportExport({ db, setDb }){
  const fileRef = useRef(null)
  function onExport(){
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "serwis-manager-backup-" + new Date().toISOString().slice(0,10) + ".json"
    a.click()
    URL.revokeObjectURL(url)
  }
  function onImport(e){
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = migrate(JSON.parse(reader.result))
        if(!data || !data.companies) throw new Error("Nieprawidłowy plik")
        setDb(data)
        alert("Dane zaimportowane")
      } catch(err){ alert("Błąd importu: " + err.message) }
    }
    reader.readAsText(file)
  }
  return (
    <div style={{display:'flex', gap:8}}>
      <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={onImport} />
      <button className="btn" onClick={()=>fileRef.current?.click()}>Import</button>
      <button className="btn" onClick={onExport}>Eksport</button>
    </div>
  )
}
