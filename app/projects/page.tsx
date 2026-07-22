'use client'

import { useEffect, useState } from 'react'

export default function ProjectCenter() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('status')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        setData(d)
        if (d.projects?.length > 0) setSelectedProject(d.projects[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#4A5568', marginTop: '12px' }}>Loading projects...</p>
    </div>
  )

  const hColor = (h: string) => h === 'green' ? '#276749' : h === 'amber' ? '#B7791F' : '#C53030'
  const hBg = (h: string) => h === 'green' ? '#d1fae5' : h === 'amber' ? '#fef3c7' : '#fef2f2'
  const hLabel = (h: string) => h === 'green' ? '🟢 On Track' : h === 'amber' ? '🟡 At Risk' : '🔴 Critical'
  const sColor = (s: string) => s === 'done' ? '#276749' : s === 'in-progress' ? '#0D7C66' : s === 'scheduled' ? '#2E86C1' : '#B7791F'
  const sBg = (s: string) => s === 'done' ? '#d1fae5' : s === 'in-progress' ? '#e6f4f1' : s === 'scheduled' ? '#dbeafe' : '#fef3c7'

  const deliverables = data?.deliverables?.filter((d: any) => d.project_id === selectedProject?.id) || []
  const contacts = data?.contacts?.filter((c: any) => c.project_id === selectedProject?.id) || []
  const appointments = data?.appointments?.filter((a: any) => a.project_id === selectedProject?.id) || []

  const tabs = [
    { id: 'status', label: '📊 Status' },
    { id: 'deliverables', label: '✅ Deliverables' },
    { id: 'contacts', label: '👥 Contacts' },
    { id: 'schedule', label: '📅 Schedule' },
  ]

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1B2A4A', marginBottom: '4px' }}>
          📂 Project Center
        </h1>
        <p style={{ fontSize: '13px', color: '#4A5568' }}>
          Active engagements — status, deliverables, contacts, and schedules
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Active Projects', value: data?.projects?.length || 0, color: '#0D7C66' },
          { label: 'On Track', value: data?.projects?.filter((p: any) => p.health === 'green').length || 0, color: '#276749' },
          { label: 'At Risk', value: data?.projects?.filter((p: any) => p.health === 'amber').length || 0, color: '#B7791F' },
          { label: 'Deliverables', value: data?.deliverables?.length || 0, color: '#2E86C1' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '11px', color: '#4A5568', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1B2A4A' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Split panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>

        {/* Left — project list */}
        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F7F8FA', background: '#F7F8FA' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Active Engagements
            </p>
          </div>
          {data?.projects?.map((p: any) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProject(p); setActiveTab('status') }}
              style={{
                width: '100%', textAlign: 'left', background: selectedProject?.id === p.id ? '#e6f4f1' : '#ffffff',
                border: 'none', borderLeft: `4px solid ${selectedProject?.id === p.id ? '#0D7C66' : 'transparent'}`,
                borderBottom: '1px solid #F7F8FA', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B2A4A', lineHeight: 1.4, paddingRight: '6px' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: hBg(p.health), color: hColor(p.health), whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {p.health === 'green' ? 'ON TRACK' : p.health === 'amber' ? 'AT RISK' : 'CRITICAL'}
                </span>
              </div>
              <p style={{ fontSize: '10px', color: '#4A5568', marginBottom: '6px' }}>PM: {p.pm_name}</p>
              <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.pct_complete}%`, background: hColor(p.health), borderRadius: '3px' }} />
              </div>
              <p style={{ fontSize: '9px', color: '#4A5568', marginTop: '3px' }}>{p.pct_complete}% complete</p>
            </button>
          ))}
        </div>

        {/* Right — project detail */}
        {selectedProject && (
          <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

            {/* Project header */}
            <div style={{ padding: '18px 22px', background: '#1B2A4A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
                    {selectedProject.name}
                  </h2>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>PM: {selectedProject.pm_name}</p>
                </div>
                <span style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, background: hBg(selectedProject.health), color: hColor(selectedProject.health) }}>
                  {hLabel(selectedProject.health)}
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Overall Progress</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#f1f5f9' }}>{selectedProject.pct_complete}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedProject.pct_complete}%`, background: hColor(selectedProject.health), borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #F7F8FA', background: '#F7F8FA' }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '11px 16px', fontSize: '11px', fontWeight: 600,
                    color: activeTab === t.id ? '#0D7C66' : '#4A5568',
                    background: 'none', border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid #0D7C66' : '2px solid transparent',
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '20px 22px' }}>

              {/* STATUS */}
              {activeTab === 'status' && (
                <div>
                  <p style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.7, marginBottom: '20px' }}>
                    {selectedProject.description || 'No description available.'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Status', value: selectedProject.status || 'Active' },
                      { label: 'Start Date', value: selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
                      { label: 'End Date', value: selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: '#F7F8FA', borderRadius: '8px', padding: '12px 14px' }}>
                        <p style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B2A4A' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1B2A4A', marginBottom: '10px' }}>Deliverable Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                    {['done', 'in-progress', 'scheduled', 'upcoming'].map(s => (
                      <div key={s} style={{ background: sBg(s), borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: sColor(s) }}>
                          {deliverables.filter((d: any) => d.status === s).length}
                        </div>
                        <div style={{ fontSize: '9px', color: sColor(s), fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DELIVERABLES */}
              {activeTab === 'deliverables' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deliverables.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#4A5568', textAlign: 'center', padding: '40px' }}>No deliverables found.</p>
                  ) : deliverables.map((d: any) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#F7F8FA', borderRadius: '8px' }}>
                      <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, background: sBg(d.status), color: sColor(d.status), whiteSpace: 'nowrap', minWidth: '70px', textAlign: 'center' }}>
                        {d.status.toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1B2A4A', marginBottom: '2px' }}>{d.name}</p>
                        <p style={{ fontSize: '10px', color: '#4A5568' }}>{d.category} · Due: {d.due_date}</p>
                      </div>
                      <p style={{ fontSize: '10px', color: '#4A5568' }}>{d.owner}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* CONTACTS */}
              {activeTab === 'contacts' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {contacts.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#4A5568', textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>No contacts found.</p>
                  ) : contacts.map((c: any) => (
                    <div key={c.id} style={{ background: '#F7F8FA', borderRadius: '10px', padding: '16px', borderLeft: c.is_primary ? '3px solid #0D7C66' : '3px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1B2A4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {c.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B2A4A' }}>{c.name}</p>
                          <p style={{ fontSize: '11px', color: '#4A5568' }}>{c.role}</p>
                        </div>
                        {c.is_primary && (
                          <span style={{ fontSize: '8px', background: '#0D7C66', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700 }}>PRIMARY</span>
                        )}
                      </div>
                      {c.email && (
                        <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#0D7C66', textDecoration: 'none', fontWeight: 600 }}>
                          ✉️ {c.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* SCHEDULE */}
              {activeTab === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appointments.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#4A5568', textAlign: 'center', padding: '40px' }}>No appointments scheduled.</p>
                  ) : appointments.map((a: any) => (
                    <div key={a.id} style={{ display: 'flex', gap: '14px', padding: '14px 16px', background: '#F7F8FA', borderRadius: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#1B2A4A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '9px', color: '#0D7C66', fontWeight: 700 }}>
                          {new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                          {new Date(a.scheduled_at).getDate()}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B2A4A', marginBottom: '4px' }}>{a.title}</p>
                        <p style={{ fontSize: '11px', color: '#4A5568', marginBottom: '2px' }}>🕐 {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                        <p style={{ fontSize: '11px', color: '#4A5568', marginBottom: '2px' }}>👤 {a.consultant}</p>
                        <p style={{ fontSize: '11px', color: '#4A5568' }}>📍 {a.location}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                        <button style={{ padding: '6px 14px', background: '#0D7C66', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          Join
                        </button>
                        <button style={{ padding: '6px 14px', background: '#ffffff', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
