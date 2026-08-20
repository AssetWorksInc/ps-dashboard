'use client'

import { useEffect, useRef, useState } from 'react'

type NotificationItem = {
  type: 'activity' | 'announcement'
  id: string
  icon: string
  title: string
  subtitle: string | null
  createdAt: string
}

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export default function NotificationBell({ tenantSlug = 'lakewood' }: { tenantSlug?: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [lastSeenCount, setLastSeenCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchNotifications() {
      try {
        const res = await fetch(`/api/notifications?tenantSlug=${tenantSlug}`)
        const data = await res.json()
        if (!cancelled && data.success) {
          setNotifications(data.notifications)
        }
      } catch (err) {
        console.error('Failed to load notifications', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tenantSlug])

  // Close the dropdown if the window resizes or scrolls, since its position
  // is calculated once at open-time relative to the viewport.
  useEffect(() => {
    if (!open) return

    function handleReposition() {
      setOpen(false)
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open])

  const unreadCount = Math.max(notifications.length - lastSeenCount, 0)

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 340
      // Anchor to the button's bottom-left, but keep the panel on-screen
      // horizontally (it would otherwise render mostly off the right edge
      // of the viewport if the button sits near the left edge, e.g. inside
      // a narrow sidebar).
      const left = Math.min(
        rect.left,
        window.innerWidth - dropdownWidth - 16
      )
      setMenuPos({ top: rect.bottom + 8, left: Math.max(left, 8) })
    }
    setOpen((prev) => !prev)
    setLastSeenCount(notifications.length)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '6px',
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#dc2626',
              color: 'white',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              lineHeight: '1.4',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Invisible full-screen overlay to catch outside clicks and close the menu */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 49,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: '340px',
              maxHeight: '420px',
              overflowY: 'auto',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 50,
            }}
          >
            <div style={{ padding: '12px 16px', fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>
              Notifications
            </div>

            {loading && (
              <div style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>Loading...</div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>
                Nothing new right now.
              </div>
            )}

            {notifications.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <div style={{ fontSize: '16px' }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#111827',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '2px',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    {timeAgo(item.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
