'use client'
import { useEffect, useState } from 'react'

const C = {
  red: '#A50021', dark: '#323E48', gray: '#697077', lightGray: '#8a9199',
  blue: '#00538C', green: '#2E7D32', amber: '#8a6400',
  greenBg: '#E7F3E8', amberBg: '#FDF3DC', redBg: '#FBE7EA',
  border: '#CCCCCC', rowBorder: '#EAECEE', zebra: '#F4F5F6', navy: '#1F3864',
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px',
  padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px',
}
const headingStyle: React.CSSProperties = {
  fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase',
  letterSpacing: '.5px', color: C.red, margin: 0,
}
const inputStyle: React.CSSProperties = {
  fontSize: '13px', padding: '6px 8px', border: `1px solid ${C.border}`,
  borderRadius: '5px', fontFamily: 'Roboto, sans-serif', width: '100%', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: C.lightGray, marginBottom: '3px', display: 'block',
  textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif',
}
const primaryBtn: React.CSSProperties = {
  padding: '6px 14px', background: C.red, color: '#fff', border: 'none', borderRadius: '5px',
  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif',
}
const secondaryBtn: React.CSSProperties = {
  padding: '6px 14px', background: '#fff', color: C.dark, border: `1px solid ${C.border}`,
  borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: C.lightGray, padding: '2px 6px',
}
const addBtn: React.CSSProperties = {
  background: 'none', border: `1px dashed ${C.border}`, borderRadius: '5px', color: C.red,
  fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 10px', fontFamily: 'Oswald, sans-serif',
}

const hColor = (h: string) => (h === 'green' ? C.green : h === 'amber' ? C.amber : C.red)
const hBg = (h: string) => (h === 'green' ? C.greenBg : h === 'amber' ? C.amberBg : C.redBg)
const hDot = (h: string) => (h === 'green' ? C.green : h === 'amber' ? '#F2A900' : C.red)
const hLabel = (h: string) => (h === 'green' ? 'On Track' : h === 'amber' ? 'Caution' : 'At Risk')

function HealthPill({ health }: { health: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: '999px', fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase' as const, letterSpacing: '.4px',
      background: hBg(health), color: hColor(health),
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: hDot(health), display: 'inline-block' }} />
      {hLabel(health)}
    </span>
  )
}

function fmtDate(d: string | null | undefined) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function toInputDate(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}
function initialsOf(name: string) {
  return (name || '').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'PS'
}

const MILESTONE_STATUSES = [
  { value: 'upcoming', label: 'Not Started' },
  { value: 'active', label: 'In Progress' },
  { value: 'done', label: 'Complete' },
]
const DELIVERABLE_STATUSES = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openAppt, setOpenAppt] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const [editingHealth, setEditingHealth] = useState(false)
  const [editingProgress, setEditingProgress] = useState(false)
  const [editingGoLive, setEditingGoLive] = useState(false)
  const [progressDraft, setProgressDraft] = useState(0)
  const [goLiveDraft, setGoLiveDraft] = useState({ go_live_date: '', go_live_label: '' })

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [milestoneDraft, setMilestoneDraft] = useState<any>({})
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [newMilestone, setNewMilestone] = useState<any>({ title: '', start_date: '', due_date: '', owner: '', status: 'upcoming', pct_complete: 0 })

  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null)
  const [deliverableDraft, setDeliverableDraft] = useState<any>({})
  const [addingDeliverable, setAddingDeliverable] = useState(false)
  const [newDeliverable, setNewDeliverable] = useState<any>({ name: '', category: '', owner: '', due_date: '', status: 'not-started' })

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [teamDraft, setTeamDraft] = useState<any>({})
  const [addingTeamMember, setAddingTeamMember] = useState(false)
  const [newTeamMember, setNewTeamMember] = useState({ name: '', role: '', department: '', email: '', phone: '' })

  function refresh() {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => {
    if (!selectedProjectId && data?.projects?.length) setSelectedProjectId(data.projects[0].id)
  }, [data])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading dashboard...</p>
    </div>
  )

  const isAdmin = !!data?.isAdmin
  const projects: any[] = data?.projects || []
  const project = projects.find(p => p.id === selectedProjectId) || projects[0] || null

  if (!project) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', padding: '80px' }}>
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '18px', color: C.dark, marginBottom: '8px' }}>No projects yet</div>
        <div style={{ fontSize: '13px', color: C.gray }}>Once a project is added for this customer, its dashboard will show here.</div>
      </div>
    )
  }

  const announcements: any[] = data?.announcements || []
  const milestones: any[] = (data?.milestones || [])
    .filter((m: any) => m.project_id === project.id)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime())
  const deliverables: any[] = (data?.deliverables || []).filter((d: any) => d.project_id === project.id)
  const actionItems = deliverables.filter((d: any) => d.status === 'scheduled' || d.status === 'in-progress')
  const team: any[] = (data?.team || []).filter((t: any) => t.is_ps_team)

  const activeMilestone = milestones.find((m: any) => m.status === 'active') || milestones.find((m: any) => m.status !== 'done')
  const doneCount = milestones.filter((m: any) => m.status === 'done').length

  async function patchProject(fields: any) {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
    })
    refresh()
  }

  async function saveMilestone(id: string) {
    await fetch(`/api/milestones/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(milestoneDraft),
    })
    setEditingMilestoneId(null)
    refresh()
  }
  async function deleteMilestone(id: string) {
    if (!confirm('Delete this milestone?')) return
    await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    refresh()
  }
  async function createMilestone() {
    if (!newMilestone.title) return
    await fetch('/api/milestones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMilestone, project_id: project.id, sort_order: milestones.length }),
    })
    setAddingMilestone(false)
    setNewMilestone({ title: '', start_date: '', due_date: '', owner: '', status: 'upcoming', pct_complete: 0 })
    refresh()
  }

  async function saveDeliverable(id: string) {
    await fetch(`/api/deliverables/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deliverableDraft),
    })
    setEditingDeliverableId(null)
    refresh()
  }
  async function deleteDeliverable(id: string) {
    if (!confirm('Delete this action item?')) return
    await fetch(`/api/deliverables/${id}`, { method: 'DELETE' })
    refresh()
  }
  async function createDeliverable() {
    if (!newDeliverable.name || !newDeliverable.category) return
    await fetch('/api/deliverables', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDeliverable, project_id: project.id }),
    })
    setAddingDeliverable(false)
    setNewDeliverable({ name: '', category: '', owner: '', due_date: '', status: 'not-started' })
    refresh()
  }

  async function saveTeamMember(id: string) {
    await fetch(`/api/team/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teamDraft),
    })
    setEditingTeamId(null)
    refresh()
  }
  async function deleteTeamMember(id: string) {
    if (!confirm('Remove this team member?')) return
    await fetch(`/api/team/${id}`, { method: 'DELETE' })
    refresh()
  }
  async function createTeamMember() {
    if (!newTeamMember.name) return
    await fetch('/api/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTeamMember, is_ps_team: true }),
    })
    setAddingTeamMember(false)
    setNewTeamMember({ name: '', role: '', department: '', email: '', phone: '' })
    refresh()
  }

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Top bar */}
    <div style={{
  background: '#ffffff', borderBottom: '4px solid #A50021', padding: '14px 150px 14px 28px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
}}>
        <div>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '16px', color: C.dark }}>
            {project.name}
          </div>
          <div style={{ fontSize: '12px', color: C.gray }}>
            Professional Services Portal · {isAdmin ? 'PS Team view (editing enabled)' : 'Customer view'}
          </div>
        </div>
        {projects.length > 1 && (
          <select
            value={project.id}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: '220px' }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div style={{ padding: '24px 28px 60px' }}>
        {/* Status strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Overall Health */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: `4px solid ${C.dark}`, borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: C.lightGray, marginBottom: '8px' }}>Overall Health</div>
              {isAdmin && !editingHealth && <button style={iconBtn} onClick={() => setEditingHealth(true)}>✎</button>}
            </div>
            {editingHealth ? (
              <div>
                <select
                  defaultValue={project.health}
                  onChange={e => { patchProject({ health: e.target.value }); setEditingHealth(false) }}
                  style={inputStyle}
                  autoFocus
                >
                  <option value="green">On Track</option>
                  <option value="amber">Caution</option>
                  <option value="red">At Risk</option>
                </select>
                <button style={{ ...secondaryBtn, marginTop: '6px' }} onClick={() => setEditingHealth(false)}>Cancel</button>
              </div>
            ) : (
              <>
                <HealthPill health={project.health} />
                <div style={{ fontSize: '12px', color: C.gray, marginTop: '8px', lineHeight: 1.4 }}>{doneCount} of {milestones.length} milestones complete</div>
              </>
            )}
          </div>

          {/* Current Phase */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: `4px solid ${C.dark}`, borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)' }}>
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: C.lightGray, marginBottom: '6px' }}>Current Phase</div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '15px', fontWeight: 700, color: C.dark, lineHeight: 1.3 }}>{activeMilestone?.title || project.name}</div>
            <div style={{ fontSize: '12px', color: C.gray, marginTop: '3px' }}>{milestones.length ? `Milestone ${milestones.indexOf(activeMilestone) + 1 || milestones.length} of ${milestones.length}` : 'No milestones yet'}</div>
          </div>

          {/* Overall Progress */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: `4px solid ${C.dark}`, borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: C.lightGray, marginBottom: '6px' }}>Overall Progress</div>
              {isAdmin && !editingProgress && <button style={iconBtn} onClick={() => { setProgressDraft(project.pct_complete || 0); setEditingProgress(true) }}>✎</button>}
            </div>
            {editingProgress ? (
              <div>
                <input type="number" min={0} max={100} value={progressDraft} onChange={e => setProgressDraft(Number(e.target.value))} style={inputStyle} autoFocus />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button style={primaryBtn} onClick={() => { patchProject({ pct_complete: progressDraft }); setEditingProgress(false) }}>Save</button>
                  <button style={secondaryBtn} onClick={() => setEditingProgress(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: C.dark }}>{project.pct_complete || 0}%</div>
                <div style={{ fontSize: '12px', color: C.gray, marginTop: '2px' }}>of project complete</div>
              </>
            )}
          </div>

          {/* Go-Live Target */}
          <div style={{ background: C.redBg, border: `2px solid ${C.red}`, borderTop: `5px solid ${C.red}`, borderRadius: '8px', padding: '16px 18px', boxShadow: '0 2px 8px rgba(165,0,33,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: C.red, fontWeight: 700, marginBottom: '6px' }}>🎯 Go-Live Target</div>
              {isAdmin && !editingGoLive && (
                <button style={{ ...iconBtn, color: C.red }} onClick={() => { setGoLiveDraft({ go_live_date: toInputDate(project.go_live_date), go_live_label: project.go_live_label || '' }); setEditingGoLive(true) }}>✎</button>
              )}
            </div>
            {editingGoLive ? (
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={goLiveDraft.go_live_date} onChange={e => setGoLiveDraft({ ...goLiveDraft, go_live_date: e.target.value })} style={{ ...inputStyle, marginBottom: '6px' }} />
                <label style={labelStyle}>Label</label>
                <input type="text" value={goLiveDraft.go_live_label} onChange={e => setGoLiveDraft({ ...goLiveDraft, go_live_label: e.target.value })} style={inputStyle} placeholder="e.g. Production Upgrade" />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button style={primaryBtn} onClick={() => { patchProject(goLiveDraft); setEditingGoLive(false) }}>Save</button>
                  <button style={secondaryBtn} onClick={() => setEditingGoLive(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 700, color: C.red }}>{fmtDate(project.go_live_date)}</div>
                <div style={{ fontSize: '12px', color: '#8E1537', marginTop: '3px', fontWeight: 600 }}>{project.go_live_label || 'Go-live date not yet set'}</div>
              </>
            )}
          </div>

          {/* Open Action Items */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: `4px solid ${C.dark}`, borderRadius: '8px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(50,62,72,.08)' }}>
            <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: C.lightGray, marginBottom: '6px' }}>Open Action Items</div>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: C.dark }}>{actionItems.length}</div>
            <div style={{ fontSize: '12px', marginTop: '3px' }}>
              <span style={{ color: C.red, fontWeight: 600 }}>{actionItems.filter((d: any) => d.status === 'in-progress').length} in progress</span>
            </div>
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={headingStyle}>📢 Announcements</h3>
              <a href="/collaboration" style={{ fontSize: '11px', fontWeight: 600, color: C.blue, textDecoration: 'none' }}>View all →</a>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {announcements.slice(0, 3).map((a: any) => (
                <div key={a.id} style={{ borderLeft: `4px solid ${C.red}`, background: C.zebra, borderRadius: '4px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {a.is_pinned && (
                      <span style={{ fontSize: '9px', background: C.red, color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Pinned</span>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.dark, fontFamily: 'Oswald, sans-serif' }}>{a.title}</span>
                    <span style={{ fontSize: '10px', color: C.lightGray, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {a.body && <p style={{ fontSize: '12px', color: C.gray, lineHeight: 1.5, margin: 0 }}>{a.body}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div>
            {/* Implementation Timeline — Gantt chart */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={headingStyle}>Implementation Timeline</h3>
                {isAdmin && <button style={addBtn} onClick={() => setAddingMilestone(true)}>+ Add Milestone</button>}
              </div>
              {milestones.length === 0 && !addingMilestone && (
                <div style={{ padding: '16px 0', color: C.lightGray, fontSize: '12px', textAlign: 'center' }}>No milestones yet</div>
              )}
              {milestones.length > 0 && (() => {
                const DAY_MS = 1000 * 60 * 60 * 24
                const timelineDates = milestones
                  .flatMap((m: any) => [m.start_date, m.due_date])
                  .filter(Boolean)
                  .map((d: string) => new Date(d).getTime())
                const ganttMin = timelineDates.length ? Math.min(...timelineDates) : Date.now()
                const ganttMaxRaw = timelineDates.length ? Math.max(...timelineDates) : Date.now() + DAY_MS * 30
                const ganttMax = Math.max(ganttMaxRaw, ganttMin + DAY_MS)
                const ganttRange = ganttMax - ganttMin
                const todayMs = Date.now()
                const todayPct = ((todayMs - ganttMin) / ganttRange) * 100
                const showToday = todayPct >= 0 && todayPct <= 100

                const monthTicks: { pct: number; label: string }[] = []
                const cursor = new Date(ganttMin)
                cursor.setDate(1)
                cursor.setHours(0, 0, 0, 0)
                const firstYear = cursor.getFullYear()
                let guard = 0
                while (cursor.getTime() <= ganttMax && guard < 60) {
                  const pct = ((cursor.getTime() - ganttMin) / ganttRange) * 100
                  if (pct >= -1) {
                    monthTicks.push({
                      pct: Math.min(Math.max(pct, 0), 100),
                      label: cursor.toLocaleDateString('en-US', {
                        month: 'short',
                        ...(cursor.getFullYear() !== firstYear ? { year: '2-digit' } : {}),
                      }),
                    })
                  }
                  cursor.setMonth(cursor.getMonth() + 1)
                  guard++
                }

                return (
                  <div style={{ marginBottom: '18px' }}>
                    {/* Month axis */}
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '14px', marginBottom: '4px' }}>
                      <div />
                      <div style={{ position: 'relative', height: '16px', borderBottom: `1px solid ${C.rowBorder}` }}>
                        {monthTicks.map((t, i) => (
                          <div key={i} style={{
                            position: 'absolute', left: `${t.pct}%`, top: 0,
                            fontSize: '10px', color: C.lightGray, fontFamily: 'Oswald, sans-serif',
                            whiteSpace: 'nowrap', transform: 'translateX(-2px)',
                          }}>
                            {t.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bars */}
                    {milestones.map((m: any, i: number) => {
                      const mStart = m.start_date ? new Date(m.start_date).getTime() : ganttMin
                      const mEndRaw = m.due_date ? new Date(m.due_date).getTime() : mStart + DAY_MS * 3
                      const mEnd = Math.max(mEndRaw, mStart + DAY_MS)
                      const leftPct = ((mStart - ganttMin) / ganttRange) * 100
                      const widthPct = Math.max(((mEnd - mStart) / ganttRange) * 100, 2)
                      const barColor = m.status === 'done' ? C.green : m.status === 'active' ? C.red : '#C9CFD4'
                      const pct = m.pct_complete || 0
                      return (
                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '14px', alignItems: 'center', padding: '6px 0' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.title}>
                              {m.status === 'done' ? '✓ ' : `${i + 1}. `}{m.title}
                            </div>
                            <div style={{ fontSize: '10px', color: C.lightGray }}>{fmtDate(m.start_date)} – {fmtDate(m.due_date)}{m.owner ? ` · ${m.owner}` : ''}</div>
                          </div>
                          <div style={{ position: 'relative', height: '18px' }}>
                            {showToday && (
                              <div style={{ position: 'absolute', left: `${todayPct}%`, top: '-3px', bottom: '-3px', width: '2px', background: C.blue, opacity: 0.5, zIndex: 2 }} title="Today" />
                            )}
                            <div
                              title={`${fmtDate(m.start_date)} – ${fmtDate(m.due_date)} · ${pct}% complete`}
                              style={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, top: 0, bottom: 0, borderRadius: '4px', background: barColor, opacity: 0.3 }}
                            />
                            <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${(widthPct * pct) / 100}%`, top: 0, bottom: 0, borderRadius: '4px', background: barColor }} />
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '10px', color: C.lightGray }}>
                      <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#C9CFD4', marginRight: '5px' }} />Not Started</span>
                      <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: C.red, marginRight: '5px' }} />In Progress</span>
                      <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: C.green, marginRight: '5px' }} />Complete</span>
                      {showToday && <span><span style={{ display: 'inline-block', width: '2px', height: '10px', background: C.blue, opacity: 0.5, marginRight: '5px', verticalAlign: 'middle' }} />Today</span>}
                    </div>
                  </div>
                )
              })()}
              {milestones.map((m: any, i: number) => (
                <div key={m.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.rowBorder}` }}>
                  {editingMilestoneId === m.id ? (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <input style={inputStyle} value={milestoneDraft.title} onChange={e => setMilestoneDraft({ ...milestoneDraft, title: e.target.value })} placeholder="Title" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <input type="date" style={inputStyle} value={toInputDate(milestoneDraft.start_date)} onChange={e => setMilestoneDraft({ ...milestoneDraft, start_date: e.target.value })} />
                        <input type="date" style={inputStyle} value={toInputDate(milestoneDraft.due_date)} onChange={e => setMilestoneDraft({ ...milestoneDraft, due_date: e.target.value })} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        <input style={inputStyle} value={milestoneDraft.owner || ''} onChange={e => setMilestoneDraft({ ...milestoneDraft, owner: e.target.value })} placeholder="Owner" />
                        <select style={inputStyle} value={milestoneDraft.status} onChange={e => setMilestoneDraft({ ...milestoneDraft, status: e.target.value })}>
                          {MILESTONE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <input type="number" min={0} max={100} style={inputStyle} value={milestoneDraft.pct_complete} onChange={e => setMilestoneDraft({ ...milestoneDraft, pct_complete: Number(e.target.value) })} placeholder="% complete" />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={primaryBtn} onClick={() => saveMilestone(m.id)}>Save</button>
                        <button style={secondaryBtn} onClick={() => setEditingMilestoneId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '10px', fontWeight: 700, color: '#fff', fontFamily: 'Oswald, sans-serif',
                        background: m.status === 'done' ? C.green : m.status === 'active' ? C.red : '#C9CFD4',
                      }}>
                        {m.status === 'done' ? '✓' : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: C.dark }}>{m.title}</div>
                        <div style={{ fontSize: '11px', color: C.lightGray }}>{fmtDate(m.start_date)} – {fmtDate(m.due_date)}{m.owner ? ` · ${m.owner}` : ''} · {m.pct_complete || 0}%</div>
                      </div>
                      {isAdmin && (
                        <div style={{ flexShrink: 0 }}>
                          <button style={iconBtn} onClick={() => { setMilestoneDraft(m); setEditingMilestoneId(m.id) }}>✎</button>
                          <button style={iconBtn} onClick={() => deleteMilestone(m.id)}>🗑</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {addingMilestone && (
                <div style={{ padding: '12px 0', display: 'grid', gap: '6px' }}>
                  <input style={inputStyle} placeholder="Title" value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} autoFocus />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input type="date" style={inputStyle} value={newMilestone.start_date} onChange={e => setNewMilestone({ ...newMilestone, start_date: e.target.value })} />
                    <input type="date" style={inputStyle} value={newMilestone.due_date} onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })} />
                  </div>
                  <input style={inputStyle} placeholder="Owner" value={newMilestone.owner} onChange={e => setNewMilestone({ ...newMilestone, owner: e.target.value })} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={primaryBtn} onClick={createMilestone}>Add</button>
                    <button style={secondaryBtn} onClick={() => setAddingMilestone(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Items */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={headingStyle}>Action Items</h3>
                {isAdmin && <button style={addBtn} onClick={() => setAddingDeliverable(true)}>+ Add Item</button>}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Item', 'Owner', 'Due', 'Status', ''].map(h => (
                      <th key={h} style={{ background: C.dark, color: '#fff', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textAlign: 'left', padding: '7px 10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliverables.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '16px 10px', color: C.lightGray, fontSize: '12px', textAlign: 'center' }}>No action items yet</td></tr>
                  ) : deliverables.map((item: any, i: number) => (
                    editingDeliverableId === item.id ? (
                      <tr key={item.id}>
                        <td colSpan={5} style={{ borderBottom: `1px solid ${C.border}`, padding: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                            <input style={inputStyle} value={deliverableDraft.name} onChange={e => setDeliverableDraft({ ...deliverableDraft, name: e.target.value })} placeholder="Name" />
                            <input style={inputStyle} value={deliverableDraft.category} onChange={e => setDeliverableDraft({ ...deliverableDraft, category: e.target.value })} placeholder="Category" />
                            <input style={inputStyle} value={deliverableDraft.owner || ''} onChange={e => setDeliverableDraft({ ...deliverableDraft, owner: e.target.value })} placeholder="Owner" />
                            <input type="date" style={inputStyle} value={toInputDate(deliverableDraft.due_date)} onChange={e => setDeliverableDraft({ ...deliverableDraft, due_date: e.target.value })} />
                          </div>
                          <select style={{ ...inputStyle, width: 'auto', marginRight: '6px' }} value={deliverableDraft.status} onChange={e => setDeliverableDraft({ ...deliverableDraft, status: e.target.value })}>
                            {DELIVERABLE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button style={primaryBtn} onClick={() => saveDeliverable(item.id)}>Save</button>{' '}
                          <button style={secondaryBtn} onClick={() => setEditingDeliverableId(null)}>Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : C.zebra }}>
                        <td style={{ borderBottom: `1px solid ${C.border}`, padding: '9px 10px', fontSize: '13px', color: C.dark }}>{item.name}</td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, padding: '9px 10px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                              {initialsOf(item.owner || 'AssetWorks')}
                            </div>
                            <span style={{ fontSize: '12px', color: C.dark }}>{item.owner || 'AssetWorks'}</span>
                          </div>
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, padding: '9px 10px', fontSize: '12px', color: C.gray }}>{fmtDate(item.due_date)}</td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, padding: '9px 10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif', background: item.status === 'in-progress' ? C.redBg : item.status === 'completed' ? C.greenBg : '#E9F1F7', color: item.status === 'in-progress' ? C.red : item.status === 'completed' ? C.green : C.blue }}>
                            {DELIVERABLE_STATUSES.find(s => s.value === item.status)?.label || item.status}
                          </span>
                        </td>
                        <td style={{ borderBottom: `1px solid ${C.border}`, padding: '9px 10px', whiteSpace: 'nowrap' }}>
                          {isAdmin && (
                            <>
                              <button style={iconBtn} onClick={() => { setDeliverableDraft(item); setEditingDeliverableId(item.id) }}>✎</button>
                              <button style={iconBtn} onClick={() => deleteDeliverable(item.id)}>🗑</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
              {addingDeliverable && (
                <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '6px' }}>
                    <input style={inputStyle} placeholder="Name" value={newDeliverable.name} onChange={e => setNewDeliverable({ ...newDeliverable, name: e.target.value })} autoFocus />
                    <input style={inputStyle} placeholder="Category" value={newDeliverable.category} onChange={e => setNewDeliverable({ ...newDeliverable, category: e.target.value })} />
                    <input style={inputStyle} placeholder="Owner" value={newDeliverable.owner} onChange={e => setNewDeliverable({ ...newDeliverable, owner: e.target.value })} />
                    <input type="date" style={inputStyle} value={newDeliverable.due_date} onChange={e => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={primaryBtn} onClick={createDeliverable}>Add</button>
                    <button style={secondaryBtn} onClick={() => setAddingDeliverable(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right column */}
          <div>
            {/* Upcoming Meetings */}
            <div style={cardStyle}>
              <h3 style={{ ...headingStyle, marginBottom: '14px' }}>Upcoming Meetings</h3>
              {(data?.appointments || []).length === 0 && (
                <div style={{ padding: '10px 0', color: C.lightGray, fontSize: '12px', textAlign: 'center' }}>No meetings scheduled</div>
              )}
              {(data?.appointments || []).map((a: any) => (
                <div key={a.id}>
                  <button
                    onClick={() => setOpenAppt(openAppt === a.id ? null : a.id)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', display: 'flex', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${C.rowBorder}`, cursor: 'pointer' }}
                  >
                    <div style={{ width: '44px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: C.red, fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                        {new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: C.dark, fontFamily: 'Oswald, sans-serif', lineHeight: 1.1 }}>
                        {new Date(a.scheduled_at).getDate()}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: C.dark, marginBottom: '2px' }}>{a.title}</div>
                      <div style={{ fontSize: '11px', color: C.lightGray }}>
                        {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {a.consultant}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: C.lightGray, alignSelf: 'center' }}>{openAppt === a.id ? '▲' : '▼'}</span>
                  </button>
                  {openAppt === a.id && (
                    <div style={{ padding: '10px 12px', background: C.zebra, borderBottom: `1px solid ${C.border}`, fontSize: '12px', color: C.gray, lineHeight: 1.7 }}>
                      📍 {a.location}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Your AssetWorks Team */}
            <div style={{ ...cardStyle, marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={headingStyle}>Your AssetWorks Team</h3>
                {isAdmin && <button style={addBtn} onClick={() => setAddingTeamMember(true)}>+ Add Member</button>}
              </div>
              {team.length === 0 && !addingTeamMember && (
                <div style={{ padding: '10px 0', color: C.lightGray, fontSize: '12px', textAlign: 'center' }}>No team members assigned yet</div>
              )}
              {addingTeamMember && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: '6px', padding: '12px', marginBottom: '12px', display: 'grid', gap: '6px' }}>
                  <input style={inputStyle} placeholder="Name*" value={newTeamMember.name} onChange={e => setNewTeamMember({ ...newTeamMember, name: e.target.value })} autoFocus />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input style={inputStyle} placeholder="Role" value={newTeamMember.role} onChange={e => setNewTeamMember({ ...newTeamMember, role: e.target.value })} />
                    <input style={inputStyle} placeholder="Department" value={newTeamMember.department} onChange={e => setNewTeamMember({ ...newTeamMember, department: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input style={inputStyle} placeholder="Email" value={newTeamMember.email} onChange={e => setNewTeamMember({ ...newTeamMember, email: e.target.value })} />
                    <input style={inputStyle} placeholder="Phone" value={newTeamMember.phone} onChange={e => setNewTeamMember({ ...newTeamMember, phone: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={primaryBtn} onClick={createTeamMember}>Add</button>
                    <button style={secondaryBtn} onClick={() => { setAddingTeamMember(false); setNewTeamMember({ name: '', role: '', department: '', email: '', phone: '' }) }}>Cancel</button>
                  </div>
                </div>
              )}
              {team.map((c: any, i: number) => (
                <div key={c.id} style={{ padding: '10px 0', borderBottom: i < team.length - 1 ? `1px solid ${C.rowBorder}` : 'none' }}>
                  {editingTeamId === c.id ? (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <input style={inputStyle} value={teamDraft.name} onChange={e => setTeamDraft({ ...teamDraft, name: e.target.value })} placeholder="Name" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <input style={inputStyle} value={teamDraft.role || ''} onChange={e => setTeamDraft({ ...teamDraft, role: e.target.value })} placeholder="Role" />
                        <input style={inputStyle} value={teamDraft.department || ''} onChange={e => setTeamDraft({ ...teamDraft, department: e.target.value })} placeholder="Department" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <input style={inputStyle} value={teamDraft.email || ''} onChange={e => setTeamDraft({ ...teamDraft, email: e.target.value })} placeholder="Email" />
                        <input style={inputStyle} value={teamDraft.phone || ''} onChange={e => setTeamDraft({ ...teamDraft, phone: e.target.value })} placeholder="Phone" />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={primaryBtn} onClick={() => saveTeamMember(c.id)}>Save</button>
                        <button style={secondaryBtn} onClick={() => setEditingTeamId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                        {initialsOf(c.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: C.dark }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: C.lightGray }}>{c.role}{c.department ? ` · ${c.department}` : ''}</div>
                        {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: '11px', color: C.blue, marginTop: '2px', display: 'block' }}>{c.email}</a>}
                        {c.phone && <div style={{ fontSize: '11px', color: C.lightGray, marginTop: '1px' }}>{c.phone}</div>}
                      </div>
                      {isAdmin && (
                        <div style={{ flexShrink: 0 }}>
                          <button style={iconBtn} onClick={() => { setTeamDraft(c); setEditingTeamId(c.id) }}>✎</button>
                          <button style={iconBtn} onClick={() => deleteTeamMember(c.id)}>🗑</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: C.lightGray, marginTop: '30px' }}>
          AssetWorks Proprietary and Confidential · PS Portal · {project.name}
        </div>
      </div>
    </div>
  )
}
