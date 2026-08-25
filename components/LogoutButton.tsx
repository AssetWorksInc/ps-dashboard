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
        background: '#A50021',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#ffffff',
        cursor: loggingOut ? 'default' : 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        fontFamily: 'Oswald, sans-serif',
      }}
    >
      {loggingOut ? 'Logging out…' : '⏻ Log Out'}
    </button>
  )
}
