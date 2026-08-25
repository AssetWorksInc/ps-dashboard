'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'
import LogoutButton from './LogoutButton'
const nav = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Project Center', href: '/projects', icon: '📂' },
  { label: 'Resource Center', href: '/resources', icon: '📚' },
  { label: 'Collaboration Hub', href: '/collaboration', icon: '🤝' },
]
export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      width: '230px',
      minWidth: '230px',
      background: '#323E48',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      <LogoutButton />
      {/* Logo */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '3px solid #A50021',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#A50021',
            fontWeight: 700,
            marginBottom: '3px',
            fontFamily: 'Oswald, sans-serif'
          }}>
            PS Portal
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Oswald, sans-serif',
            letterSpacing: '0.3px'
          }}>
            AssetWorks
          </div>
          <div style={{ fontSize: '10px', color: '#8a9199', marginTop: '2px' }}>
            Professional Services
          </div>
        </div>
        <NotificationBell />
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 18px',
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                color: active ? '#ffffff' : '#8a9199',
                background: active ? 'rgba(165,0,33,0.2)' : 'transparent',
                borderLeft: active ? '3px solid #A50021' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      {/* User footer */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#A50021',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            fontFamily: 'Oswald, sans-serif'
          }}>
            LS
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>
              Lakewood State
            </div>
            <div style={{ fontSize: '9px', color: '#697077' }}>
              Full-Service Tier
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
