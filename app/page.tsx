'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openAppt, setOpenAppt] = useState<string | null>(null)

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

  const firstProject = data?.projects?.[0]
  const health = firstProject?.health || 'green'
  const pct = firstProject?.pct_complete || 0

  const hColor = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#8a6400' : '#A50021'
  const hBg = (h: string) => h === 'green' ? '#E7F3E8' : h === 'amber' ? '#FDF3DC' : '#FBE7EA'
  const hDot = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#F2A900' : '#A50021'
  const hLabel = (h: string) => h === 'green' ? 'On Track' : h === 'amber' ? 'At Risk' : 'Critical'

  const pill = (h: string) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: '999px', fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase' as const, letterSpacing: '.4px',
      background: hBg(h), color: hColor(h)
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: hDot(h), display: 'inline-block' }} />
      {hLabel(h)}
    </span>
  )

  const phases = data?.projects?.length > 0 ? [
    { name: 'Onboarding & Discovery', dates: 'Jan 15 – Feb 28, 2026', pct: 100, status: 'done' },
    { name: 'System Configuration', dates: 'Mar 1 – Apr 30, 2026', pct: 100, status: 'done' },
    { name: 'PS Subscription — Year 1', dates: 'May 1 – Aug 31, 2026', pct: pct, status: 'active' },
    { name: 'AiM 12.x Upgrade', dates: 'Mar 1 – Jul 25, 2026', pct: data?.projects?.[1]?.pct_complete || 68, status: 'active' },
    { name: 'Training & Enablement', dates: 'Jul 10 – Aug 15, 2026', pct: 0, status: 'upcoming' },
    { name: 'Go-Live & Hypercare', dates: 'Aug 15 – Sep 30, 2026', pct: 0, status: 'upcoming' },
  ] : []

  const actionItems = data?.deliverables?.filter((d: any) =>
    d.status === 'scheduled' || d.status === 'in-progress'
  )?.slice(0, 5) || []

  const documents = [
    { icon: 'PDF', name: 'PS Subscription Statement of Work', sub: 'Updated Jan 15, 2026' },
    { icon: 'XLS', name: 'Deliverables Tracker — H1 2026', sub: 'Updated Jun 5, 2026' },
    { icon: 'PPT', name: 'Q2 Business Review Deck', sub: 'Updated Apr 8, 2026' },
    { icon: 'DOC', name: 'AiM 12.3 Upgrade Readiness Checklist', sub: 'Updated Jun 5, 2026' },
  ]

  const team = [
    { initials: 'AR', name: 'Amanda Rivera', role: 'Dedicated CSM', email: 'amanda.rivera@assetworks.com' },
    { initials: 'JT', name: 'James Thornton', role: 'Senior Consultant', email: 'james.thornton@assetworks.com' },
    { initials: 'CN', name: 'Chris Nguyen', role: 'Integration Specialist', email: 'chris.nguyen@assetworks.com' },
  ]

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
          <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '16px', color: '#323E48' }}>
            Lakewood State University — AiM Subscription
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Professional Services Portal · Customer view
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/collaboration')}
            style={{
              background: 'transparent', color: '#A50021', border: '2px solid #A50021',
              fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '13px',
              borderRadius: '6px', padding: '7px 16px', cursor: 'pointer'
            }}
          >
            Contact PS Team
          </button>
          <button
            onClick={() => router.push('/projects')}
            style={{
              background: '#A50021', color: '#ffffff', border: 'none',
              fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '13px',
              borderRadius: '6px', padding: '7px 16px', cursor: 'pointer'
            }}
          >
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Page body */}
      <div style={{ padding: '24px 28px 60px' }}>

        {/* Status strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px', marginBottom: '24px' }}>

          {/* Overall Health */}
          <button
            onClick={() => router.push('/projects')}
            style={{ background: '#fff', border: '1px solid #CCCCCC', borderTop: '4px solid #323E48', borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(50,62,72,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(50,62,72,.08)'}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '8px' }}>Overall Health</div>
            {pill(health)}
            <div style={{ fontSize: '12px', color: '#697077', marginTop: '8px', lineHeight: 1.4 }}>Next milestone in {data?.milestones?.length || 0} items</div>
            <div style={{ fontSize: '10px', color: '#A50021', marginTop: '6px', fontWeight: 600 }}>View projects →</div>
          </button>

          {/* Current Phase */}
          <button
            onClick={() => router.push('/projects')}
            style={{ background: '#fff', border: '1px solid #CCCCCC', borderTop: '4px solid #323E48', borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(50,62,72,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(50,62,72,.08)'}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>Current Phase</div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: 700, color: '#323E48', lineHeight: 1.3 }}>PS Subscription — Year 1</div>
            <div style={{ fontSize: '12px', color: '#697077', marginTop: '3px' }}>Phase 3 of 6</div>
            <div style={{ fontSize: '10px', color: '#A50021', marginTop: '6px', fontWeight: 600 }}>View projects →</div>
          </button>

          {/* Overall Progress */}
          <button
            onClick={() => router.push('/projects')}
            style={{ background: '#fff', border: '1px solid #CCCCCC', borderTop: '4px solid #323E48', borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(50,62,72,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(50,62,72,.08)'}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>Overall Progress</div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>{pct}%</div>
            <div style={{ fontSize: '12px', color: '#697077', marginTop: '2px' }}>of subscription complete</div>
            <div style={{ fontSize: '10px', color: '#A50021', marginTop: '6px', fontWeight: 600 }}>View projects →</div>
          </button>

          {/* Go-Live Target */}
          <button
            onClick={() => router.push('/collaboration')}
            style={{
              background: '#FBE7EA', border: '2px solid #A50021', borderTop: '5px solid #A50021',
              borderRadius: '8px', padding: '16px 18px', boxShadow: '0 2px 8px rgba(165,0,33,0.12)',
              cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(165,0,33,0.25)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(165,0,33,0.12)'}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#A50021', fontWeight: 700, marginBottom: '6px' }}>🎯 Go-Live Target</div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 700, color: '#A50021' }}>
              {data?.milestones?.[1]?.due_date ? new Date(data.milestones[1].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 12, 2026'}
            </div>
            <div style={{ fontSize: '12px', color: '#8E1537', marginTop: '3px', fontWeight: 600 }}>AiM 12.3 Production Upgrade</div>
            <div style={{ fontSize: '10px', color: '#A50021', marginTop: '6px', fontWeight: 600 }}>View schedule →</div>
          </button>

          {/* Open Action Items */}
          <button
            onClick={() => router.push('/projects')}
            style={{ background: '#fff', border: '1px solid #CCCCCC', borderTop: '4px solid #323E48', borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(50,62,72,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(50,62,72,.08)'}
          >
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>Open Action Items</div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>{actionItems.length}</div>
            <div style={{ fontSize: '12px', marginTop: '3px' }}>
              <span style={{ color: '#A50021', fontWeight: 600 }}>{actionItems.filter((d: any) => d.status === 'in-progress').length} in progress</span>
            </div>
            <div style={{ fontSize: '10px', color: '#A50021', marginTop: '6px', fontWeight: 600 }}>View projects →</div>
          </button>

        </div>

        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* Left column */}
          <div>

            {/* Implementation Timeline */}
            <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>Implementation Timeline</h3>
                <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#00538C', cursor: 'pointer' }}>View full schedule →</button>
              </div>
              {phases.map((phase, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0', borderBottom: i < phases.length - 1 ? '1px solid #EAECEE' : 'none' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '11px', fontWeight: 700, color: '#fff',
                    fontFamily: 'Oswald, sans-serif',
                    background: phase.status === 'done' ? '#2E7D32' : phase.status === 'active' ? '#A50021' : '#C9CFD4'
                  }}>
                    {phase.status === 'done' ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#323E48' }}>{phase.name}</div>
                    <div style={{ fontSize: '11px', color: '#8a9199' }}>{phase.dates}</div>
                  </div>
                  <div style={{ width: '120px', height: '6px', background: '#EAECEE', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${phase.pct}%`, background: '#A50021', borderRadius: '4px' }} />
                  </div>
                  <div style={{ width: '36px', textAlign: 'right', fontSize: '12px', color: '#697077', flexShrink: 0 }}>{phase.pct}%</div>
                </div>
              ))}
            </div>

            {/* Action Items */}
            <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>Action Items</h3>
                <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#00538C', cursor: 'pointer' }}>View all →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Item', 'Owner', 'Due', 'Status'].map(h => (
                      <th key={h} style={{ background: '#323E48', color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textAlign: 'left', padding: '7px 10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {actionItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px 10px', color: '#8a9199', fontSize: '12px', textAlign: 'center' }}>No open action items</td>
                    </tr>
                  ) : actionItems.map((item: any, i: number) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#F4F5F6' }}>
                      <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '13px', color: '#323E48' }}>{item.name}</td>
                      <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1F3864', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                            {item.owner?.split(' ').map((n: string) => n[0]).join('') || 'AW'}
                          </div>
                          <span style={{ fontSize: '12px', color: '#323E48' }}>{item.owner || 'AssetWorks'}</span>
                        </div>
                      </td>
                      <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{item.due_date || 'TBD'}</td>
                      <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif', background: item.status === 'in-progress' ? '#FBE7EA' : '#E9F1F7', color: item.status === 'in-progress' ? '#A50021' : '#00538C' }}>
                          {item.status === 'in-progress' ? 'In Progress' : 'Scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right column */}
          <div>

            {/* Upcoming Meetings */}
            <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '14px' }}>Upcoming Meetings</h3>
              {data?.appointments?.map((a: any, i: number) => (
                <div key={a.id}>
                  <button
                    onClick={() => setOpenAppt(openAppt === a.id ? null : a.id)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #EAECEE', cursor: 'pointer' }}
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
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#323E48', marginBottom: '2px' }}>{a.title}</div>
                      <div style={{ fontSize: '11px', color: '#8a9199' }}>
                        {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {a.consultant}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8a9199', alignSelf: 'center' }}>{openAppt === a.id ? '▲' : '▼'}</span>
                  </button>
                  {openAppt === a.id && (
                    <div style={{ padding: '10px 12px', background: '#F4F5F6', borderBottom: '1px solid #CCCCCC', fontSize: '12px', color: '#697077', lineHeight: 1.7 }}>
                      📍 {a.location}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button style={{ padding: '5px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>Join</button>
                        <button style={{ padding: '5px 12px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Reschedule</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Documents */}
            <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '14px' }}>
                Documents
              </h3>
              {documents.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < documents.length - 1 ? '1px solid #EAECEE' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '5px', background: '#EAECEE', color: '#A50021', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                    {doc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#323E48', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                    <div style={{ fontSize: '11px', color: '#8a9199' }}>{doc.sub}</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#00538C', fontSize: '14px', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>↓</button>
                </div>
              ))}
            </div>

            {/* Your AssetWorks Team */}
            <div style={{ background: '#fff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)' }}>
              <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '14px' }}>Your AssetWorks Team</h3>
              {team.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < team.length - 1 ? '1px solid #EAECEE' : 'none' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1F3864', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                    {c.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#323E48' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#8a9199' }}>{c.role}</div>
                    <a href={`mailto:${c.email}`} style={{ fontSize: '11px', color: '#00538C', marginTop: '2px', display: 'block' }}>{c.email}</a>
                  </div>
                </div>
              ))}
            </div>

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
