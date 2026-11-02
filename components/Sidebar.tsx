'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type IconName = 'grid' | 'briefcase' | 'users' | 'ticket' | 'pulse' | 'folder' | 'book' | 'chat'

const ICONS: Record<IconName, ReactNode> = {
  grid: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  briefcase: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5c2.2.7 3.5 2.6 3.5 5.5" /></>),
  ticket: (<><path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z" /><path d="M14 5v14" strokeDasharray="2 3" /></>),
  pulse: (<polyline points="3 12 7 12 10 5 14 19 17 12 21 12" />),
  folder: (<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />),
  book: (<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>),
  chat: (<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />),
}

type NavItem = { label: string; href: string; icon: IconName }

const managementNav: NavItem[] = [
  { label: 'Dashboard', href: '/management', icon: 'grid' },
  { label: 'Portfolio', href: '/management/portfolio', icon: 'briefcase' },
  { label: 'Accounts', href: '/management/accounts', icon: 'users' },
  { label: 'Tickets', href: '/management/tickets', icon: 'ticket' },
  { label: 'Activity', href: '/management/activity', icon: 'pulse' },
]

const psNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'grid' },
  { label: 'Project Center', href: '/projects', icon: 'folder' },
  { label: 'Resource Center', href: '/resources', icon: 'book' },
  { label: 'Collaboration Hub', href: '/collaboration', icon: 'chat' },
]

// Sections that have child pages (e.g. /projects/123) stay highlighted on those pages.
// '/' and '/management' are exact-match only, because every other page starts with them.
function isActive(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === '/' || href === '/management') return false
  return pathname.startsWith(href + '/')
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      padding: '8px 20px',
      fontSize: '13px',
      letterSpacing: '1.4px',
      textTransform: 'uppercase',
      color: '#AEB9C4',
      fontWeight: 700,
    }}>
      {children}
    </div>
  )
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href)
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '15px 20px',
        borderRadius: '18px',
        fontSize: '19px',
        fontWeight: 600,
        color: active ? '#ffffff' : '#F1F5F9',
        background: active ? '#A50021' : 'transparent',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
    >
      <svg
        width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" style={{ flexShrink: 0 }}
      >
        {ICONS[item.icon]}
      </svg>
      <span>{item.label}</span>
    </Link>
  )
}

export default function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname()
  return (
    <aside style={{
      width: '312px',
      minWidth: '312px',
      background: '#323E48',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '26px 24px 22px', borderBottom: '3px solid #A50021' }}>
        <div style={{
          fontSize: '12px',
          letterSpacing: '2.4px',
          textTransform: 'uppercase',
          color: '#ffffff',
          fontWeight: 700,
        }}>
          PS Portal
        </div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', marginTop: '2px' }}>
          AssetWorks
        </div>
        <div style={{ fontSize: '14px', color: '#AEB9C4', marginTop: '2px' }}>
          Professional Services
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {userRole === 'admin' && (
          <>
            <GroupLabel>Management Center</GroupLabel>
            {managementNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
            <div style={{ height: '14px' }} />
            <GroupLabel>Professional Services</GroupLabel>
          </>
        )}
        {psNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#A50021',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            LS
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Lakewood State</div>
            <div style={{ fontSize: '12px', color: '#AEB9C4' }}>Full-Service Tier</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
