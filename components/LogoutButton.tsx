'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Even if the request fails, still send the user back to login
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 100,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#A50021',
        cursor: loggingOut ? 'default' : 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {loggingOut ? 'Logging out…' : '⏻ Log Out'}
    </button>
  )
}
