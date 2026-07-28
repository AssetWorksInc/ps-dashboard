'use client'

import { useEffect, useState } from 'react'

export default function ProjectCenter() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('status')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

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
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading projects...</p>
    </div>
  )

  const hColor = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#8a6400' : '#A50021'
  const hBg = (h: string) => h === 'green' ? '#E7F3E8' : h === 'amber' ? '#FDF3DC' : '#FBE7EA'
  const hDot = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#F2A900' : '#A50021'
  const hLabel = (h: string) => h === 'green' ? 'On Track' : h === 'amber' ? 'At Risk' : 'Critical'
  const sColor = (s: string) => s === 'done' ? '#2E7D32' : s === 'in-progress' ? '#A50021' : s === 'scheduled' ? '#00538C' : '#8a6400'
  const sBg = (s: string) => s === 'done' ? '#E7F3E8' : s === 'in-progress' ? '#FBE7EA' : s === 'scheduled' ? '#E9F1F7' : '#FDF3DC'

  const pill = (h: string) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '10px', fontWeight: 600, padding: '2px 9px',
      borderRadius: '999px', fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase' as const, letterSpacing: '.4px',
      background: hBg(h), color: hColor(h)
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: hDot(h), display: 'inline-block' }} />
      {hLabel(h)}
    </span>
  )

  const deliverables = data?.deliverables?.filter((d: any) => d.project_id === selectedProject?.id) || []
  const contacts = data?.contacts?.filter((c: any) => c.project_id === selectedProject?.id) || []
  const appointments = data?.appointments?.filter((a: any) => a.project_id === selectedProject?.id) || []

  const tabs = [
    { id: 'status', label: 'Project Status' },
    { id: 'deliverables', label: 'Deliverables' },
    { id: 'contacts', label: 'Key Contacts' },
    { id: 'schedule', label: 'Schedule' },
  ]

  const handleSave = async (health: string, status: string) => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/projects/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProject.id, health, status })
      })
      const result = await res.json()
      if (result.success) {
        setSelectedProject({ ...selectedProject, health, status })
        setData((prev: any) => ({
          ...prev,
          projects: prev.projects.map((p: any) =>
            p.id === selectedProject.id ? { ...p, health, status } : p
          )
        }))
        setSaveMessage({ type: 'success', text: '✅ Project updated successfully.' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: '❌ Update failed. Please try again.' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: '❌ Something went wrong.' })
    }
    setSaving(false)
  }

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '4px solid #A50021',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '16px', color: '#323E48' }}>
            Project Center
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Active engagements · deliverables · contacts · schedules
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#697077' }}>
            {data?.projects?.length || 0} active project{data?.projects?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 28px 60px' }}>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Active Projects', value: data?.projects?.length || 0, color: '#A50021' },
            { label: 'On Track', value: data?.projects?.filter((p: any) => p.health === 'green').length || 0, color: '#2E7D32' },
            { label: 'At Risk', value: data?.projects?.filter((p: any) => p.health === 'amber').length || 0, color: '#8a6400' },
            { label: 'Total Deliverables', value: data?.deliverables?.length || 0, color: '#00538C' },
          ].map((k, i) => (
            <div key={i} style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderTop: `4px solid ${k.color}`,
              borderRadius: '8px', padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(50,62,72,.08)'
            }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>
                {k.label}
              </div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Split panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>

          {/* Left — engagement list */}
          <div style={{
            background: '#ffffff', border: '1px solid #CCCCCC',
            borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#323E48',
              borderBottom: '1px solid #CCCCCC'
            }}>
              <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Active Engagements
              </p>
            </div>
            {data?.projects?.map((p: any) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); setActiveTab('status') }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderLeft: `4px solid ${selectedProject?.id === p.id ? '#A50021' : 'transparent'}`,
                  borderBottom: '1px solid #EAECEE',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: selectedProject?.id === p.id ? '#FBE7EA' : '#ffffff',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#323E48', lineHeight: 1.4, paddingRight: '6px' }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontSize: '8px', padding: '2px 6px', borderRadius: '3px', fontWeight: 700,
                    background: hBg(p.health), color: hColor(p.health),
                    fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    {p.health === 'green' ? 'On Track' : p.health === 'amber' ? 'At Risk' : 'Critical'}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: '#8a9199', marginBottom: '6px' }}>PM: {p.pm_name}</p>
                <div style={{ height: '5px', background: '#EAECEE', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.pct_complete}%`, background: '#A50021', borderRadius: '3px' }} />
                </div>
                <p style={{ fontSize: '9px', color: '#8a9199', marginTop: '3px' }}>{p.pct_complete}% complete</p>
              </button>
            ))}
          </div>

          {/* Right — detail panel */}
          {selectedProject && (
            <div style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
              overflow: 'hidden'
            }}>

              {/* Project header */}
              <div style={{
                padding: '18px 22px',
                background: '#323E48',
                borderBottom: '1px solid #CCCCCC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '4px', fontFamily: 'Oswald, sans-serif' }}>
                      {selectedProject.name}
                    </h2>
                    <p style={{ fontSize: '11px', color: '#8a9199' }}>PM: {selectedProject.pm_name}</p>
                  </div>
                  {pill(selectedProject.health)}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#8a9199' }}>Overall Progress</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>{selectedProject.pct_complete}%</span>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedProject.pct_complete}%`, background: '#A50021', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #CCCCCC', background: '#F4F5F6' }}>
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: '11px 18px', fontSize: '12px',
                      fontFamily: 'Oswald, sans-serif', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '.3px',
                      color: activeTab === t.id ? '#A50021' : '#697077',
                      background: 'none', border: 'none',
                      borderBottom: activeTab === t.id ? '3px solid #A50021' : '3px solid transparent',
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
                    <p style={{ fontSize: '13px', color: '#697077', lineHeight: 1.7, marginBottom: '20px' }}>
                      {selectedProject.description || 'No description available.'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                      {[
                        { label: 'Status', value: selectedProject.status || 'Active' },
                        { label: 'Start Date', value: selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
                        { label: 'End Date', value: selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px 14px' }}>
                          <p style={{ fontSize: '9px', color: '#8a9199', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Oswald, sans-serif' }}>{s.label}</p>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                      Deliverable Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '24px' }}>
                      {['done', 'in-progress', 'scheduled', 'upcoming'].map(s => (
                        <div key={s} style={{ background: sBg(s), border: `1px solid ${sColor(s)}33`, borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '22px', fontWeight: 700, color: sColor(s) }}>
                            {deliverables.filter((d: any) => d.status === s).length}
                          </div>
                          <div style={{ fontSize: '9px', color: sColor(s), fontWeight: 700, textTransform: 'uppercase', marginTop: '2px', fontFamily: 'Oswald, sans-serif' }}>{s}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#F4F5F6', borderRadius: '8px', padding: '16px 18px', border: '1px solid #CCCCCC' }}>
                      <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, color: '#323E48', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>
                        ✏️ Update Project
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>
                            Health
                          </label>
                          <select
                            id="health-select"
                            defaultValue={selectedProject.health}
                            key={selectedProject.id + '-health'}
                            style={{ width: '100%', padding: '9px 12px', fontSize: '12px', border: '1px solid #CCCCCC', borderRadius: '6px', color: '#323E48', background: '#ffffff', cursor: 'pointer' }}
                          >
                            <option value="green">🟢 On Track</option>
                            <option value="amber">🟡 At Risk</option>
                            <option value="red">🔴 Critical</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>
                            Status
                          </label>
                          <select
                            id="status-select"
                            defaultValue={selectedProject.status}
                            key={selectedProject.id + '-status'}
                            style={{ width: '100%', padding: '9px 12px', fontSize: '12px', border: '1px solid #CCCCCC', borderRadius: '6px', color: '#323E48', background: '#ffffff', cursor: 'pointer' }}
                          >
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="complete">Complete</option>
                          </select>
                        </div>
                      </div>
                      {saveMessage && (
                        <div style={{
                          padding: '10px 14px', borderRadius: '6px', marginBottom: '10px',
                          fontSize: '12px', fontWeight: 600,
                          background: saveMessage.type === 'success' ? '#E7F3E8' : '#FBE7EA',
                          color: saveMessage.type === 'success' ? '#2E7D32' : '#A50021',
                          border: `1px solid ${saveMessage.type === 'success' ? '#a3d9a5' : '#f5c6cb'}`
                        }}>
                          {saveMessage.text}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const health = (document.getElementById('health-select') as HTMLSelectElement)?.value
                          const status = (document.getElementById('status-select') as HTMLSelectElement)?.value
                          handleSave(health, status)
                        }}
                        disabled={saving}
                        style={{
                          width: '100%', padding: '10px',
                          background: saving ? '#C9CFD4' : '#A50021',
                          color: '#ffffff', border: 'none', borderRadius: '6px',
                          fontFamily: 'Oswald, sans-serif', fontSize: '13px',
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
                          cursor: saving ? 'default' : 'pointer'
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* DELIVERABLES */}
                {activeTab === 'deliverables' && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          {['Deliverable', 'Category', 'Due', 'Owner', 'Status'].map(h => (
                            <th key={h} style={{
                              background: '#323E48', color: '#ffffff',
                              fontFamily: 'Oswald, sans-serif', fontWeight: 600,
                              textAlign: 'left', padding: '8px 10px',
                              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px'
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deliverables.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#8a9199', fontSize: '12px' }}>
                              No deliverables found for this project.
                            </td>
                          </tr>
                        ) : deliverables.map((d: any, i: number) => (
                          <tr key={d.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#F4F5F6' }}>
                            <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 500 }}>
                              {d.name}
                            </td>
                            <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>
                              {d.category}
                            </td>
                            <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>
                              {d.due_date}
                            </td>
                            <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '20px', height: '20px', borderRadius: '50%',
                                  background: '#1F3864', color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '9px', fontWeight: 700, fontFamily: 'Oswald, sans-serif'
                                }}>
                                  {d.owner?.split(' ').map((n: string) => n[0]).join('') || 'AW'}
                                </div>
                                <span style={{ fontSize: '12px', color: '#323E48' }}>{d.owner}</span>
                              </div>
                            </td>
                            <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px' }}>
                              <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '.3px',
                                fontFamily: 'Oswald, sans-serif',
                                background: sBg(d.status), color: sColor(d.status)
                              }}>
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CONTACTS */}
                {activeTab === 'contacts' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {contacts.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>
                        No contacts found.
                      </p>
                    ) : contacts.map((c: any) => (
                      <div key={c.id} style={{
                        background: '#F4F5F6', border: '1px solid #CCCCCC',
                        borderLeft: c.is_primary ? '4px solid #A50021' : '1px solid #CCCCCC',
                        borderRadius: '8px', padding: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: '#1F3864', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: '#fff', flexShrink: 0, fontFamily: 'Oswald, sans-serif'
                          }}>
                            {c.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48' }}>{c.name}</p>
                            <p style={{ fontSize: '11px', color: '#697077' }}>{c.role}</p>
                          </div>
                          {c.is_primary && (
                            <span style={{ fontSize: '8px', background: '#A50021', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                              Primary
                            </span>
                          )}
                        </div>
                        {c.email && (
                          <a href={`mailto:${c.email}`} style={{ fontSize: '11px', color: '#00538C', display: 'block' }}>
                            ✉️ {c.email}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SCHEDULE */}
                {activeTab === 'schedule' && (
                  <div>
                    {appointments.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px' }}>
                        No appointments scheduled.
                      </p>
                    ) : appointments.map((a: any, i: number) => (
                      <div key={a.id} style={{
                        display: 'flex', gap: '14px', padding: '14px 0',
                        borderBottom: i < appointments.length - 1 ? '1px solid #EAECEE' : 'none',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ width: '44px', textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#A50021', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                            {new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: '#323E48', fontFamily: 'Oswald, sans-serif', lineHeight: 1.1 }}>
                            {new Date(a.scheduled_at).getDate()}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48', marginBottom: '4px' }}>{a.title}</p>
                          <p style={{ fontSize: '11px', color: '#697077', marginBottom: '2px' }}>
                            🕐 {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                          <p style={{ fontSize: '11px', color: '#697077', marginBottom: '2px' }}>👤 {a.consultant}</p>
                          <p style={{ fontSize: '11px', color: '#697077' }}>📍 {a.location}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                          <button style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>
                            Join
                          </button>
                          <button style={{ padding: '6px 14px', background: '#ffffff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
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
    </div>
  )
}
