'use client'

import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  description: string
  health: string
  pct_complete: number
  pm_name: string
  start_date: string
  end_date: string
  status: string
}

interface Deliverable {
  id: string
  project_id: string
  category: string
  name: string
  status: string
  due_date: string
  owner: string
}

interface Contact {
  id: string
  project_id: string
  name: string
  role: string
  email: string
  is_primary: boolean
}

interface Appointment {
  id: string
  project_id: string
  title: string
  consultant: string
  scheduled_at: string
  location: string
}

interface ProjectData {
  projects: Project[]
  deliverables: Deliverable[]
  contacts: Contact[]
  appointments: Appointment[]
}

export default function ProjectCenter() {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
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

  const healthBg = (health: string) => {
    if (health === 'green') return '#d1fae5'
    if (health === 'amber') return '#fef3c7'
    return '#fef2f2'
  }

  const healthLabel = (health: string) => {
    if (health === 'green') return 'On Track'
    if (health === 'amber') return 'At Risk'
    return 'Critical'
  }

  const statusColor = (status: string) => {
    if (status === 'done') return '#276749'
    if (status === 'in-progress') return '#0D7C66'
    if (status === 'scheduled') return '#2E86C1'
    if (status === 'upcoming') return '#B7791F'
    return '#94a3b8'
  }

  const statusBg = (status: string) => {
    if (status === 'done') return '#d1fae5'
    if (status === 'in-progress') return '#e6f4f1'
    if (status === 'scheduled') return '#dbeafe'
    if (status === 'upcoming') return '#fef3c7'
    return '#f1f5f9'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--slate)', fontSize: '13px' }}>Loading projects...</p>
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
          📂 Project Center
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--slate)' }}>
          Active engagements, deliverables, and key contacts
        </p>
      </div>

      {/* KPI row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid var(--teal)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>Active Projects</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)' }}>{data?.projects?.length || 0}</div>
        </div>
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid #276749'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>On Track</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#276749' }}>
            {data?.projects?.filter(p => p.health === 'green').length || 0}
          </div>
        </div>
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid #B7791F'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>At Risk</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#B7791F' }}>
            {data?.projects?.filter(p => p.health === 'amber').length || 0}
          </div>
        </div>
        <div style={{
          background: 'var(--white)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderTop: '3px solid var(--blue)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px' }}>Total Deliverables</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)' }}>
            {data?.deliverables?.length || 0}
          </div>
        </div>
      </div>

      {/* Project cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {data?.projects?.map(p => {
          const projectDeliverables = data.deliverables.filter(d => d.project_id === p.id)
          const projectContacts = data.contacts.filter(c => c.project_id === p.id)
          const projectAppointments = data.appointments.filter(a => a.project_id === p.id)
          const isExpanded = expanded === p.id

          return (
            <div key={p.id} style={{
              background: 'var(--white)',
              borderRadius: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              borderLeft: `4px solid ${healthColor(p.health)}`,
              overflow: 'hidden'
            }}>
              {/* Card header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : p.id)}
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '6px'
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--navy)'
                    }}>
                      {p.name}
                    </h3>
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: healthBg(p.health),
                      color: healthColor(p.health)
                    }}>
                      {healthLabel(p.health)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--slate)',
                    marginBottom: '10px',
                    lineHeight: 1.5
                  }}>
                    PM: {p.pm_name}
                  </p>
                  <div style={{
                    height: '6px',
                    background: 'var(--ltgray)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    maxWidth: '300px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${p.pct_complete}%`,
                      background: healthColor(p.health),
                      borderRadius: '3px'
                    }} />
                  </div>
                  <p style={{
                    fontSize: '10px',
                    color: 'var(--slate)',
                    marginTop: '4px'
                  }}>
                    {p.pct_complete}% complete
                  </p>
                </div>
                <div style={{
                  fontSize: '18px',
                  color: 'var(--slate)',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▾
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--ltgray)',
                  padding: '18px 20px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '20px'
                  }}>
                    {/* Deliverables */}
                    <div>
                      <h4 style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--navy)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '10px'
                      }}>
                        Deliverables
                      </h4>
                      {projectDeliverables.length === 0 ? (
                        <p style={{ fontSize: '11px', color: 'var(--slate)' }}>No deliverables</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {projectDeliverables.map(d => (
                            <div key={d.id} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px'
                            }}>
                              <span style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: statusBg(d.status),
                                color: statusColor(d.status),
                                whiteSpace: 'nowrap',
                                marginTop: '1px'
                              }}>
                                {d.status}
                              </span>
                              <div>
                                <p style={{ fontSize: '11px', color: 'var(--navy)', fontWeight: 600 }}>
                                  {d.name}
                                </p>
                                <p style={{ fontSize: '10px', color: 'var(--slate)' }}>
                                  {d.due_date}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Key Contacts */}
                    <div>
                      <h4 style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--navy)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '10px'
                      }}>
                        Key Contacts
                      </h4>
                      {projectContacts.length === 0 ? (
                        <p style={{ fontSize: '11px', color: 'var(--slate)' }}>No contacts</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {projectContacts.map(c => (
                            <div key={c.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--teal)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#fff',
                                flexShrink: 0
                              }}>
                                {c.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--navy)' }}>
                                  {c.name}
                                </p>
                                <p style={{ fontSize: '10px', color: 'var(--slate)' }}>
                                  {c.role}
                                </p>
                              </div>
                              {c.is_primary && (
                                <span style={{
                                  fontSize: '8px',
                                  background: 'var(--teal)',
                                  color: '#fff',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontWeight: 700
                                }}>
                                  PRIMARY
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Appointments */}
                    <div>
                      <h4 style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--navy)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '10px'
                      }}>
                        Scheduled Sessions
                      </h4>
                      {projectAppointments.length === 0 ? (
                        <p style={{ fontSize: '11px', color: 'var(--slate)' }}>No appointments</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {projectAppointments.map(a => (
                            <div key={a.id} style={{
                              padding: '8px 10px',
                              background: 'var(--ltgray)',
                              borderRadius: '6px'
                            }}>
                              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--navy)' }}>
                                {a.title}
                              </p>
                              <p style={{ fontSize: '10px', color: 'var(--slate)', marginTop: '2px' }}>
                                {new Date(a.scheduled_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })} · {a.consultant}
                              </p>
                              <p style={{ fontSize: '10px', color: 'var(--slate)' }}>
                                📍 {a.location}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
