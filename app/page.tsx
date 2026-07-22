'use client'

import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  description: string
  health: string
  pct_complete: number
  pm_name: string
}

interface Announcement {
  id: string
  title: string
  body: string
  priority: string
  is_pinned: boolean
  author: string
  created_at: string
}

interface Milestone {
  id: string
  title: string
  due_date: string
  status: string
  owner: string
}

interface Activity {
  id: string
  actor: string
  action: string
  target: string
  icon: string
  created_at: string
}

interface Appointment {
  id: string
  title: string
  consultant: string
  scheduled_at: string
  location: string
}

interface DashboardData {
  projects: Project[]
  announcements: Announcement[]
  milestones: Milestone[]
  activity: Activity[]
  appointments: Appointment[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const healthColor = (health: string) => {
    if (health === 'green') return '#276749'
    if (health === 'amber') return '#B7791F'
    return '#C53030'
  }

  const healthLabel = (health: string) => {
    if (health === 'green') return 'On Track'
    if (health === 'amber') return 'At Risk'
    return 'Critical'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--slate)', fontSize: '13px' }}>Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--navy)',
          marginBottom: '4px'
        }}>
          Good morning, Lakewood State 👋
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--slate)' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Announcements */}
      {data?.announcements && data.announcements.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--navy)',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📢 Announcements
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.announcements.map(a => (
              <div key={a.id} style={{
                background: 'var(--white)',
                borderRadius: '10px',
                padding: '14px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${a.priority === 'high' ? 'var(--red)' : 'var(--teal)'}`,
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {a.is_pinned && (
                      <span style={{
                        fontSize: '9px',
                        background: 'var(--teal)',
                        color: '#fff',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        PINNED
                      </span>
                    )}
                    {a.priority === 'high' && (
                      <span style={{
                        fontSize: '9px',
                        background: '#fef2f2',
                        color: 'var(--red)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        border: '1px solid #fecaca'
                      }}>
                        ACTION NEEDED
                      </span>
                    )}
                  </div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    marginBottom: '4px'
                  }}>
                    {a.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--slate)', lineHeight: 1.6 }}>
                    {a.body}
                  </p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                    By {a.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid var(--teal)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>
            Active Projects
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)' }}>
            {data?.projects?.length || 0}
          </div>
        </div>

        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid var(--blue)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>
            Upcoming Milestones
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy)' }}>
            {data?.milestones?.length || 0}
          </div>
        </div>

        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid var(--green)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>
            Next Appointment
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginTop: '4px' }}>
            {data?.appointments?.[0]
              ? new Date(data.appointments[0].scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'None scheduled'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--slate)', marginTop: '2px' }}>
            {data?.appointments?.[0]?.title || ''}
          </div>
        </div>
      </div>

      {/* 2 column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Active Projects */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--navy)',
            marginBottom: '14px'
          }}>
            📂 Active Projects
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data?.projects?.map(p => (
              <div key={p.id} style={{
                borderLeft: `3px solid ${healthColor(p.health)}`,
                paddingLeft: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    marginBottom: '4px',
                    lineHeight: 1.4
                  }}>
                    {p.name}
                  </h3>
                  <span style={{
                    fontSize: '9px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: p.health === 'green' ? '#d1fae5' : p.health === 'amber' ? '#fef3c7' : '#fef2f2',
                    color: healthColor(p.health),
                    whiteSpace: 'nowrap',
                    marginLeft: '8px'
                  }}>
                    {healthLabel(p.health)}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--slate)', marginBottom: '6px' }}>
                  PM: {p.pm_name}
                </p>
                <div style={{
                  height: '6px',
                  background: 'var(--ltgray)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${p.pct_complete}%`,
                    background: healthColor(p.health),
                    borderRadius: '3px'
                  }} />
                </div>
                <p style={{ fontSize: '10px', color: 'var(--slate)', marginTop: '4px' }}>
                  {p.pct_complete}% complete
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--navy)',
            marginBottom: '14px'
          }}>
            🎯 Upcoming Milestones
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.milestones?.map(m => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'var(--ltgray)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: '9px', color: 'var(--teal)', fontWeight: 700 }}>
                    {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)' }}>
                    {new Date(m.due_date).getDate()}
                  </div>
                </div>
                <div>
                  <h3 style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--navy)',
                    marginBottom: '2px'
                  }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: '10px', color: 'var(--slate)' }}>
                    {m.owner}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div style={{
        background: 'var(--white)',
        borderRadius: '10px',
        padding: '18px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--navy)',
          marginBottom: '14px'
        }}>
          ⚡ Recent Activity
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data?.activity?.map(a => (
            <div key={a.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--ltgray)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--teal-lt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0
              }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', color: 'var(--dkgray)' }}>
                  <strong>{a.actor}</strong> {a.action} <strong>{a.target}</strong>
                </p>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {new Date(a.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <div style={{
        background: 'var(--white)',
        borderRadius: '10px',
        padding: '18px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--navy)',
          marginBottom: '14px'
        }}>
          📅 Upcoming Appointments
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data?.appointments?.map(a => (
            <div key={a.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              background: 'var(--ltgray)',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'var(--navy)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{ fontSize: '9px', color: 'var(--teal)', fontWeight: 700 }}>
                  {new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                  {new Date(a.scheduled_at).getDate()}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  marginBottom: '2px'
                }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: '10px', color: 'var(--slate)' }}>
                  {a.consultant} · {a.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
