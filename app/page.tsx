'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openAnnouncement, setOpenAnnouncement] = useState<string | null>(null)
  const [openAppointment, setOpenAppointment] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading dashboard...</p>
    </div>
  )

  const hColor = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#8a6400' : '#A50021'
  const hBg = (h: string) => h === 'green' ? '#E7F3E8' : h === 'amber' ? '#FDF3DC' : '#FBE7EA'
  const hLabel = (h: string) => h === 'green' ? 'On Track' : h === 'amber' ? 'At Risk' : 'Critical'
  const hDot = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#F2A900' : '#A50021'

  const firstProject = data?.projects?.[0]
  const health = firstProject?.health || 'green'
  const pct = firstProject?.pct_complete || 0

  const pill = (h: string, label: string) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '11px',
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: '999px',
      fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase' as const,
      letterSpacing: '.4px',
      background: hBg(h),
      color: hColor(h)
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: hDot(h), display: 'inline-block' }} />
      {label}
    </span>
  )

  const card = (children: React.ReactNode, mb = '20px') => (
    <div style={{
      background: '#ffffff',
      border: '1px solid #CCCCCC',
      borderRadius: '8px',
      padding: '20px 22px',
      boxShadow: '0 1px 3px rgba(50,62,72,.08)',
      marginBottom: mb
    }}>
      {children}
    </div>
  )

  const cardHead = (title: string, action?: () => void, actionLabel = 'View all →') => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <h3 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '.5px',
        color: '#A50021',
        margin: 0
      }}>
        {title}
      </h3>
      {action && (
        <button
          onClick={action}
          style={{
            background: 'none', border: 'none', fontSize: '12px',
            color: '#00538C', cursor: 'pointer', fontFamily: 'Roboto, sans-serif'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '4px solid #A50021',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            color: '#323E48'
          }}>
            Lakewood State University — PS Subscription
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Professional Services Portal · Customer view
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/collaboration')}
            style={{
              background: 'transparent',
              color: '#A50021',
              border: '2px solid #A50021',
              fontFamily: 'Oswald, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '6px',
              padding: '7px 16px',
              cursor: 'pointer'
            }}
          >
            Contact PS Team
          </button>
          <button
            onClick={() => router.push('/projects')}
            style={{
              background: '#A50021',
              color: '#ffffff',
              border: 'none',
              fontFamily: 'Oswald, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '6px',
              padding: '7px 16px',
              cursor: 'pointer'
            }}
          >
            View Projects
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: '24px 28px 60px' }}>

        {/* ── STATUS STRIP ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>

          {/* Overall Health */}
          <div style={{
            background: '#ffffff', border: '1px solid #CCCCCC',
            borderRadius: '8px', padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(50,62,72,.08)'
          }}>
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '8px' }}>
              Overall Health
            </div>
            {pill(health, hLabel(health))}
            <div style={{ fontSize: '12px', color: '#697077', marginTop: '8px', lineHeight: 1.4 }}>
              {data?.milestones?.[0]?.title || 'No upcoming milestones'}
            </div>
          </div>

          {/* Active Projects */}
          <button
            onClick={() => router.push('/projects')}
            style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderRadius: '8px', padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(50,62,72,.08)',
              cursor: 'pointer', textAlign: 'left'
            }}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>
              Active Projects
            </div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>
              {data?.projects?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#00538C', marginTop: '4px', fontWeight: 600 }}>
              View all →
            </div>
          </button>

          {/* Overall Progress */}
          <div style={{
            background: '#ffffff', border: '1px solid #CCCCCC',
            borderRadius: '8px', padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(50,62,72,.08)'
          }}>
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>
              Overall Progress
            </div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>
              {pct}%
            </div>
            <div style={{ fontSize: '12px', color: '#697077', marginTop: '2px' }}>
              of subscription complete
            </div>
          </div>

          {/* Next Milestone */}
          <button
            onClick={() => document.getElementById('milestones-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderRadius: '8px', padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(50,62,72,.08)',
              cursor: 'pointer', textAlign: 'left'
            }}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>
              Next Milestone
            </div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 700, color: '#323E48', lineHeight: 1.3 }}>
              {data?.milestones?.[0]?.due_date
                ? new Date(data.milestones[0].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'TBD'}
            </div>
            <div style={{ fontSize: '12px', color: '#697077', marginTop: '3px' }}>
              {data?.milestones?.[0]?.title || '—'}
            </div>
          </button>

          {/* Announcements */}
          <button
            onClick={() => document.getElementById('announcements-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderRadius: '8px', padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(50,62,72,.08)',
              cursor: 'pointer', textAlign: 'left'
            }}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>
              Announcements
            </div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>
              {data?.announcements?.length || 0}
            </div>
            <div style={{ fontSize: '12px', marginTop: '3px' }}>
              <span style={{ color: '#A50021', fontWeight: 600 }}>
                {data?.announcements?.filter((a: any) => a.priority === 'high').length || 0} action needed
              </span>
            </div>
          </button>

        </div>

        {/* ── 2-COLUMN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* LEFT */}
          <div>

            {/* Active Projects card */}
            {card(
              <>
                {cardHead('Active Projects', () => router.push('/projects'))}
                {data?.projects?.map((p: any, i: number) => (
                  <button
                    key={p.id}
                    onClick={() => router.push('/projects')}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      padding: '12px 0',
                      borderBottom: i < data.projects.length - 1 ? '1px solid #EAECEE' : 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px'
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: p.health === 'green' ? '#2E7D32' : '#A50021',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                      fontFamily: 'Oswald, sans-serif'
                    }}>
                      {p.health === 'green' ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#323E48' }}>{p.name}</span>
                        {pill(p.health, hLabel(p.health))}
                      </div>
                      <div style={{ fontSize: '11px', color: '#697077', marginBottom: '6px' }}>
                        PM: {p.pm_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#EAECEE', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.pct_complete}%`, background: '#A50021', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#697077', width: '36px', textAlign: 'right' }}>
                          {p.pct_complete}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Announcements */}
            <div
              id="announcements-section"
              style={{
                background: '#ffffff', border: '1px solid #CCCCCC',
                borderRadius: '8px', padding: '20px 22px',
                boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px'
              }}
            >
              {cardHead('Announcements')}
              {data?.announcements?.map((a: any) => (
                <div key={a.id} style={{ marginBottom: '8px' }}>
                  <button
                    onClick={() => setOpenAnnouncement(openAnnouncement === a.id ? null : a.id)}
                    style={{
                      width: '100%', textAlign: 'left', background: '#ffffff', border: 'none',
                      borderLeft: `4px solid ${a.priority === 'high' ? '#A50021' : '#2E7D32'}`,
                      borderRadius: '6px', padding: '12px 16px',
                      boxShadow: '0 1px 3px rgba(50,62,72,.06)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      {a.priority === 'high' && (
                        <span style={{
                          fontSize: '9px', background: '#FBE7EA', color: '#A50021',
                          padding: '2px 7px', borderRadius: '4px', fontWeight: 700,
                          border: '1px solid #f5c6cb', fontFamily: 'Oswald, sans-serif',
                          textTransform: 'uppercase', whiteSpace: 'nowrap'
                        }}>
                          Action Needed
                        </span>
                      )}
                      {a.is_pinned && (
                        <span style={{
                          fontSize: '9px', background: '#E7F3E8', color: '#2E7D32',
                          padding: '2px 7px', borderRadius: '4px', fontWeight: 700,
                          fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', whiteSpace: 'nowrap'
                        }}>
                          Pinned
                        </span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#323E48' }}>
                        {a.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8a9199', flexShrink: 0 }}>
                      {openAnnouncement === a.id ? '▲' : '▼'}
                    </span>
                  </button>
                  {openAnnouncement === a.id && (
                    <div style={{
                      background: '#F4F5F6', borderRadius: '0 0 6px 6px',
                      padding: '12px 16px', borderTop: '1px solid #EAECEE'
                    }}>
                      <p style={{ fontSize: '13px', color: '#697077', lineHeight: 1.7, marginBottom: '8px' }}>
                        {a.body}
                      </p>
                      <p style={{ fontSize: '11px', color: '#8a9199' }}>
                        By {a.author} · {new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Activity Feed */}
            {card(
              <>
                {cardHead('Recent Activity')}
                {data?.activity?.map((a: any, i: number) => (
                  <button
                    key={a.id}
                    onClick={() => router.push('/projects')}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 0',
                      borderBottom: i < (data?.activity?.length - 1) ? '1px solid #EAECEE' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: '#EAECEE', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', flexShrink: 0
                    }}>
                      {a.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', color: '#323E48' }}>
                        <strong>{a.actor}</strong> {a.action} <strong>{a.target}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#8a9199' }}>
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '12px', color: '#A50021' }}>→</span>
                    </div>
                  </button>
                ))}
              </>
            )}

          </div>

          {/* RIGHT */}
          <div>

            {/* Upcoming Meetings */}
            {card(
              <>
                {cardHead('Upcoming Meetings')}
                {data?.appointments?.map((a: any, i: number) => (
                  <button
                    key={a.id}
                    onClick={() => setOpenAppointment(openAppointment === a.id ? null : a.id)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      display: 'flex', gap: '12px', padding: '10px 0',
                      borderBottom: i < (data?.appointments?.length - 1) ? '1px solid #EAECEE' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '44px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#A50021', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                        {new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#323E48', fontFamily: 'Oswald, sans-serif', lineHeight: 1.1 }}>
                        {new Date(a.scheduled_at).getDate()}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#323E48', marginBottom: '2px' }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8a9199' }}>
                        {a.consultant} · {a.location}
                      </div>
                    </div>
                  </button>
                ))}
                {/* Expanded appointment detail */}
                {openAppointment && data?.appointments?.filter((a: any) => a.id === openAppointment).map((a: any) => (
                  <div key={a.id} style={{
                    marginTop: '10px', padding: '12px 14px',
                    background: '#F4F5F6', borderRadius: '8px',
                    border: '1px solid #CCCCCC'
                  }}>
                    <p style={{ fontSize: '12px', color: '#697077', marginBottom: '10px', lineHeight: 1.6 }}>
                      📅 {new Date(a.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}<br />
                      🕐 {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}<br />
                      👤 {a.consultant}<br />
                      📍 {a.location}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>
                        Join Meeting
                      </button>
                      <button style={{ padding: '6px 14px', background: '#ffffff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Milestones */}
            <div id="milestones-section">
              {card(
                <>
                  {cardHead('Upcoming Milestones')}
                  {data?.milestones?.map((m: any, i: number) => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '9px 0',
                      borderBottom: i < (data?.milestones?.length - 1) ? '1px solid #EAECEE' : 'none'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '5px',
                        background: '#EAECEE', color: '#A50021',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', flexShrink: 0
                      }}>
                        🎯
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#323E48', fontSize: '12px', marginBottom: '2px' }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8a9199' }}>
                          {m.due_date
                            ? new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'TBD'} · {m.owner}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* PS Team */}
            {card(
              <>
                {cardHead('Your AssetWorks Team')}
                {[
                  { initials: 'AR', name: 'Amanda Rivera', role: 'Dedicated CSM', email: 'amanda.rivera@assetworks.com' },
                  { initials: 'JT', name: 'James Thornton', role: 'Senior Consultant', email: 'james.thornton@assetworks.com' },
                  { initials: 'CN', name: 'Chris Nguyen', role: 'Integration Specialist', email: 'chris.nguyen@assetworks.com' },
                ].map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 0',
                    borderBottom: i < 2 ? '1px solid #EAECEE' : 'none'
                  }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: '#1F3864', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                      fontFamily: 'Oswald, sans-serif'
                    }}>
                      {c.initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#323E48' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#8a9199' }}>{c.role}</div>
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>
                        <a href={`mailto:${c.email}`} style={{ color: '#00538C' }}>{c.email}</a>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#8a9199', marginTop: '30px' }}>
          AssetWorks Proprietary and Confidential · PS Portal · Lakewood State University
        </div>

      </div>
    </div>
  )
}
