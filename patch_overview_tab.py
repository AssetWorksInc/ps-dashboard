#!/usr/bin/env python3
"""
Patch: turn the Project Center's "Project Status" tab into "Overview" —
adds a KPI row (Backlog, AWA Hours, % Complete, Next Milestone), an
admin-only Engagement Status / Delivery Signal / PM Comment card, and a
Key Contacts preview — while keeping every existing tab and field intact.

Run from the repo root: python3 patch_overview_tab.py
Safe to re-run: each anchor is matched exactly once; if a previous run
already applied, this will fail loudly instead of double-patching.
"""
import sys

PAGE_PATH = "app/projects/page.tsx"
API_PATH = "app/api/projects/route.ts"


def apply_one(path, old, new, label):
    with open(path, "r") as f:
        content = f.read()
    count = content.count(old)
    if count == 0:
        print(f"FAIL [{label}]: anchor not found in {path}")
        sys.exit(1)
    if count > 1:
        print(f"FAIL [{label}]: anchor found {count} times in {path} (expected exactly 1)")
        sys.exit(1)
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print(f"OK   [{label}]")


# ---------------------------------------------------------------------------
# 1. app/api/projects/route.ts — add the portal-owned status/signal columns
#    and next-milestone fields to the projects SELECT.
# ---------------------------------------------------------------------------
apply_one(
    API_PATH,
    """      `SELECT p.id, p.tenant_id, t.name AS tenant_name, p.name, p.description, p.health, p.pct_complete, p.pm_name,
              p.start_date, p.end_date, p.status, p.go_live_date, p.go_live_label,
              p.budget_hours_total, p.budget_hours_used, p.hourly_rate, p.budget_status
       FROM projects p""",
    """      `SELECT p.id, p.tenant_id, t.name AS tenant_name, p.name, p.description, p.health, p.pct_complete, p.pm_name,
              p.start_date, p.end_date, p.status, p.go_live_date, p.go_live_label,
              p.budget_hours_total, p.budget_hours_used, p.hourly_rate, p.budget_status,
              p.engagement_status, p.epic, p.confluence_url, p.pm_comment,
              p.next_milestone, p.next_milestone_date
       FROM projects p""",
    "api/projects: add engagement_status/epic/pm_comment/next_milestone columns",
)

# ---------------------------------------------------------------------------
# 2. app/projects/page.tsx
# ---------------------------------------------------------------------------

# 2a. Import the shared signal calculator (pure functions, no server deps —
#     safe to use from this client component, same as the Portfolio page).
apply_one(
    PAGE_PATH,
    "import NotesEditor from '@/components/NotesEditor'\n",
    "import NotesEditor from '@/components/NotesEditor'\n"
    "import { signalFor, ENGAGEMENT_STATUSES } from '@/lib/portfolioSignal'\n",
    "page: import signalFor/ENGAGEMENT_STATUSES",
)

# 2b. Rename the default/initial tab id.
apply_one(
    PAGE_PATH,
    "  const [activeTab, setActiveTab] = useState('status')\n",
    "  const [activeTab, setActiveTab] = useState('overview')\n",
    "page: rename initial activeTab state",
)

# 2c. Rename the tab bar entry + label.
apply_one(
    PAGE_PATH,
    "    { id: 'status', label: 'Project Status' },\n",
    "    { id: 'overview', label: 'Overview' },\n",
    "page: rename tab bar entry",
)

# 2d. Rename the tab id set when a project is picked from the list.
apply_one(
    PAGE_PATH,
    "                onClick={() => { setSelectedProject(p); setActiveTab('status') }}\n",
    "                onClick={() => { setSelectedProject(p); setActiveTab('overview') }}\n",
    "page: rename setActiveTab on project select",
)

# 2e. Add small color/label helpers for the six-value Engagement Status
#     model, right next to the existing health/status color helpers.
apply_one(
    PAGE_PATH,
    "  const hLabel = (h: string) => h === 'green' ? 'On Track' : h === 'amber' ? 'At Risk' : 'Critical'\n",
    "  const hLabel = (h: string) => h === 'green' ? 'On Track' : h === 'amber' ? 'At Risk' : 'Critical'\n"
    "  const engColor = (k: string) => k === 'GREEN' ? '#2E7D32' : k === 'YELLOW' ? '#8a6400' : k === 'RED' ? '#A50021' : k === 'BLUE' ? '#00538C' : k === 'GREY' ? '#697077' : '#8a9199'\n"
    "  const engBg = (k: string) => k === 'GREEN' ? '#E7F3E8' : k === 'YELLOW' ? '#FDF3DC' : k === 'RED' ? '#FBE7EA' : k === 'BLUE' ? '#E9F1F7' : k === 'GREY' ? '#EEF0F1' : '#F4F5F6'\n"
    "  const engLabel = (k: string) => ENGAGEMENT_STATUSES.find(s => s.key === k)?.label || 'Unclassified'\n",
    "page: add engagement-status color/label helpers",
)

# 2f. The main event: rename the tab conditional to 'overview' and insert
#     the new KPI row / admin status card / Key Contacts preview as the
#     first things rendered inside it. Everything already in this tab
#     (description, Status/Start/End cards, Deliverable Summary, the
#     Update Project editor) is left completely untouched below it.
NEW_OVERVIEW_INTRO = """                {activeTab === 'overview' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                      {(() => {
                        const ndrRow = (data?.netsuiteDashboardRows || []).find((r: any) => r.project_id === selectedProject.id)
                        const backlog = ndrRow?.services_backlog != null ? `$${Number(ndrRow.services_backlog).toLocaleString()}` : '—'
                        const awaHours = hoursTotal > 0 ? `${hoursUsed.toFixed(0)} / ${hoursTotal.toFixed(0)}` : '—'
                        const pctComplete = selectedProject.pct_complete != null ? `${selectedProject.pct_complete}%` : '—'
                        const nextMilestone = selectedProject.next_milestone
                          ? `${selectedProject.next_milestone}${selectedProject.next_milestone_date ? ' · ' + new Date(selectedProject.next_milestone_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
                          : 'Not set'
                        const tiles = [
                          { label: 'Backlog', value: backlog, accent: '#A50021' },
                          { label: 'AWA Hours', value: awaHours, accent: '#00538C' },
                          { label: '% Complete', value: pctComplete, accent: '#2E7D32' },
                          { label: 'Next Milestone', value: nextMilestone, accent: '#8a6400' },
                        ]
                        return tiles.map(t => (
                          <div key={t.label} style={{ background: '#fff', border: '1px solid #CCCCCC', borderLeft: `4px solid ${t.accent}`, borderRadius: '8px', padding: '12px 14px' }}>
                            <p style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: '#8a9199', fontFamily: 'Oswald, sans-serif', margin: 0 }}>{t.label}</p>
                            <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '17px', fontWeight: 700, color: '#323E48', margin: '5px 0 0' }}>{t.value}</p>
                          </div>
                        ))
                      })()}
                    </div>
                    {isAdmin && (() => {
                      const ndrRow = (data?.netsuiteDashboardRows || []).find((r: any) => r.project_id === selectedProject.id)
                      const d10 = (s: any) => s ? String(s).slice(0, 10) : null
                      const signal = signalFor({
                        pctComplete: ndrRow?.pct_complete != null ? Number(ndrRow.pct_complete) : null,
                        contractSignedDate: d10(ndrRow?.contract_signed_date),
                        lastTimeEntryDate: d10(ndrRow?.last_time_entry_date),
                        servicesBacklog: ndrRow?.services_backlog != null ? Number(ndrRow.services_backlog) : null,
                        epic: selectedProject.epic || null,
                      }, new Date().toISOString().slice(0, 10))
                      const eng = selectedProject.engagement_status || 'OPEN'
                      return (
                        <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase' as const, letterSpacing: '.5px', margin: 0 }}>
                              PS-internal · admin only
                            </p>
                            <Link href="/management/portfolio" style={{ fontSize: '11px', color: '#A50021', fontWeight: 600, textDecoration: 'none' }}>
                              Edit in Portfolio →
                            </Link>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: selectedProject.pm_comment ? '10px' : 0, flexWrap: 'wrap' as const }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600,
                              padding: '3px 10px', borderRadius: '999px', fontFamily: 'Oswald, sans-serif',
                              textTransform: 'uppercase' as const, letterSpacing: '.4px',
                              background: engBg(eng), color: engColor(eng)
                            }}>
                              Status: {engLabel(eng)}
                            </span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600,
                              padding: '3px 10px', borderRadius: '999px', fontFamily: 'Oswald, sans-serif',
                              textTransform: 'uppercase' as const, letterSpacing: '.4px',
                              background: hBg(signal.level), color: hColor(signal.level)
                            }}>
                              Signal: {signal.label}
                            </span>
                          </div>
                          {selectedProject.pm_comment && (
                            <p style={{ fontSize: '12px', color: '#323E48', lineHeight: 1.6, margin: 0, fontStyle: 'italic' as const }}>
                              &ldquo;{selectedProject.pm_comment}&rdquo;
                            </p>
                          )}
                        </div>
                      )
                    })()}
                    {contacts.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                          Key Contacts
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                          {contacts.slice(0, 4).map((c: any) => (
                            <div key={c.id} style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '10px 12px' }}>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: '#323E48', margin: 0 }}>
                                {c.name}{c.is_primary && <span style={{ fontSize: '9px', color: '#A50021', marginLeft: '5px' }}>★ Primary</span>}
                              </p>
                              <p style={{ fontSize: '10.5px', color: '#8a9199', margin: '2px 0 0' }}>{c.role || '—'}</p>
                              {c.email && <p style={{ fontSize: '10.5px', color: '#697077', margin: '2px 0 0' }}>{c.email}</p>}
                            </div>
                          ))}
                        </div>
                        {contacts.length > 4 && (
                          <p style={{ fontSize: '10.5px', color: '#8a9199', marginTop: '6px' }}>
                            +{contacts.length - 4} more in Customer Contacts →
                          </p>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: '13px', color: '#697077', lineHeight: 1.7, marginBottom: '20px' }}>
                      {selectedProject.description || 'No description available.'}
                    </p>
"""

OLD_OVERVIEW_INTRO = """                {activeTab === 'status' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#697077', lineHeight: 1.7, marginBottom: '20px' }}>
                      {selectedProject.description || 'No description available.'}
                    </p>
"""

apply_one(
    PAGE_PATH,
    OLD_OVERVIEW_INTRO,
    NEW_OVERVIEW_INTRO,
    "page: rename activeTab conditional + insert Overview content",
)

print("\nAll patches applied successfully.")
