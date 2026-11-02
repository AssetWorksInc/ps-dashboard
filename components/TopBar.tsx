'use client'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'
import LogoutButton from './LogoutButton'

// Page names are unchanged from the sidebar. This only maps a URL to its breadcrumb.
const PAGES: Record<string, { group: string; page: string }> = {
  '/': { group: 'Professional Services', page: 'Dashboard' },
  '/projects': { group: 'Professional Services', page: 'Project Center' },
  '/resources': { group: 'Professional Services', page: 'Resource Center' },
  '/collaboration': { group: 'Professional Services', page: 'Collaboration Hub' },
  '/management': { group: 'Management Center', page: 'Dashboard' },
  '/management/portfolio': { group: 'Management Center', page: 'Portfolio' },
  '/management/accounts': { group: 'Management Center', page: 'Accounts' },
  '/management/tickets': { group: 'Management Center', page: 'Tickets' },
  '/management/activity': { group: 'Management Center', page: 'Activity' },
}

function lookup(pathname: string) {
  if (PAGES[pathname]) return PAGES[pathname]
  // Child pages such as /projects/123 use their parent section's names.
  const parent = Object.keys(PAGES)
    .filter(p => p !== '/' && p !== '/management' && pathname.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return parent ? PAGES[parent] : null
}

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export default function TopBar({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname()
  const crumb = lookup(pathname)
  const roleLabel = userRole === 'admin' ? 'PS Admin' : userRole ? 'Customer' : ''
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '14px 32px',
      background: '#ffffff',
      borderBottom: '1px solid #E2E5E9',
    }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#64748B' }}>
        <span>Home</span>
        {crumb && (
          <>
            <span aria-hidden="true">›</span>
            <span>{crumb.group}</span>
            <span aria-hidden="true">›</span>
            <span style={{ color: '#323E48', fontWeight: 600 }}>{crumb.page}</span>
          </>
        )}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <NotificationBell />
        {userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '14px', borderLeft: '1px solid #E2E5E9' }}>
            <span aria-hidden="true" style={{
              width: '36px', height: '36px', borderRadius: '50%', background: '#A50021', color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px',
            }}>
              {initials(userName)}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#323E48' }}>{userName}</span>
              {roleLabel && <span style={{ fontSize: '12px', color: '#64748B' }}>{roleLabel}</span>}
            </span>
          </div>
        )}
        <LogoutButton />
      </div>
    </header>
  )
}
