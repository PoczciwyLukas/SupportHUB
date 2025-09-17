import React from 'react'
import { useAuth } from './AuthProvider'
import Login from './Login'

export default function Protected({ children }){
  const { user, loading } = useAuth()
  if(loading) return <div style={{padding:24}}>Ładowanie...</div>
  if(!user) return <Login />
  return children
}