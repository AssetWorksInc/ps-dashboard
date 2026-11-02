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
        borderRadius: '12px',
        padding: '10px 18px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#ffffff',
        cursor: loggingOut ? 'default' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {loggingOut ? 'Logging out…' : '⏻ Log Out'}
    </button>
  )
}
