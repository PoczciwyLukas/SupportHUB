import React, { useRef } from 'react'
import { migrate } from '../utils'
import { useLanguage } from '../i18n.jsx'

export default function ImportExport({ db, setDb }){
  const fileRef = useRef(null)
  const { t } = useLanguage()
  function onExport(){
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = t('importExport.fileNamePrefix') + "-" + new Date().toISOString().slice(0,10) + ".json"
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
        if(!data || !data.companies) throw new Error(t('importExport.invalidFile'))
        setDb(data)
        alert(t('importExport.importSuccess'))
      } catch(err){ alert(t('importExport.importError', { error: err.message })) }
    }
    reader.readAsText(file)
    // reset input so importing the same file again triggers change event
    e.target.value = ""
  }
  return (
    <div style={{display:'flex', gap:8}}>
      <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={onImport} />
      <button className="btn" onClick={()=>fileRef.current?.click()}>{t('importExport.import')}</button>
      <button className="btn" onClick={onExport}>{t('importExport.export')}</button>
    </div>
  )
}
