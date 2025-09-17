
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const OrgCtx = createContext(null)

export function OrgProvider({ children }){
  const [orgs, setOrgs] = useState([])
  const [roleByOrg, setRoleByOrg] = useState(new Map())
  const [currentOrgId, setCurrentOrgId] = useState(() => localStorage.getItem('currentOrgId') || '')

  useEffect(() => {
    async function load(){
      const { data, error } = await supabase
        .from('org_members')
        .select('org_id, role, orgs ( id, name, created_at )')
      if(error){ console.error(error); return }
      const rows = (data || []).map(r => ({ id: r.orgs.id, name: r.orgs.name, role: r.role, created_at: r.orgs.created_at }))
      setOrgs(rows.map(r => ({ id: r.id, name: r.name, created_at: r.created_at })))
      setRoleByOrg(new Map(rows.map(r => [r.id, r.role])))
      if(!currentOrgId && rows.length) {
        setCurrentOrgId(rows[0].id)
        localStorage.setItem('currentOrgId', rows[0].id)
      }
    }
    load()
  }, [])

  const currentOrg = orgs.find(o => o.id === currentOrgId) || null
  const role = currentOrg ? (roleByOrg.get(currentOrg.id) || 'viewer') : 'viewer'
  const selectOrg = (id) => { setCurrentOrgId(id); localStorage.setItem('currentOrgId', id) }

  return <OrgCtx.Provider value={{ orgs, currentOrg, role, selectOrg }}>{children}</OrgCtx.Provider>
}

export function useOrg(){ return useContext(OrgCtx) }
