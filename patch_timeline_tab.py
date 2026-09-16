#!/usr/bin/env python3
"""
Patch: add a new "Timeline" tab to Project Center — a visual proportional
timeline (project Start Date -> End Date, with a red "today" marker and a
dot per deliverable positioned by its due date) plus a chronological list
below it. Purely a read-only view over the existing `deliverables` data and
the project's own start/end dates — no new table, no new API route, no new
state. "Schedule" (meeting/appointment calendar) is a different thing and is
left completely untouched.

Run from the repo root: python3 patch_timeline_tab.py
Safe to re-run: each anchor is matched exactly once; if a previous run
already applied, this will fail loudly instead of double-patching.
"""
import sys

PAGE_PATH = "app/projects/page.tsx"


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


# 1. Tab bar entry, right after Tasks.
apply_one(
    PAGE_PATH,
    "    { id: 'tasks', label: 'Tasks' },\n",
    "    { id: 'tasks', label: 'Tasks' },\n"
    "    { id: 'timeline', label: 'Timeline' },\n",
    "page: add Timeline tab bar entry",
)

# 2. The tab panel itself — inserted right before the Deliverables panel.
NEW_TIMELINE_PANEL = """                {/* TIMELINE */}
                {activeTab === 'timeline' && (
                  <div>
                    {(() => {
                      const start = selectedProject.start_date ? new Date(selectedProject.start_date) : null
                      const end = selectedProject.end_date ? new Date(selectedProject.end_date) : null
                      const hasRange = !!(start && end && end.getTime() > start.getTime())
                      const today = new Date()
                      const todayPct = hasRange ? Math.min(100, Math.max(0, ((today.getTime() - start!.getTime()) / (end!.getTime() - start!.getTime())) * 100)) : null
                      const dated = deliverables.filter((d: any) => d.due_date)
                      const undated = deliverables.filter((d: any) => !d.due_date)
                      const sorted = [...dated].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                      return (
                        <>
                          {hasRange ? (
                            <div style={{ marginBottom: '28px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8a9199', marginBottom: '6px' }}>
                                <span>{start!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span>{end!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div style={{ position: 'relative', height: '54px', background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '8px' }}>
                                {todayPct !== null && (
                                  <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: '2px', background: '#A50021', zIndex: 2 }} title="Today">
                                    <span style={{ position: 'absolute', top: '-16px', left: '-14px', fontSize: '9px', fontWeight: 700, color: '#A50021', fontFamily: 'Oswald, sans-serif' }}>Today</span>
                                  </div>
                                )}
                                {dated.map((d: any) => {
                                  const dueTime = new Date(d.due_date).getTime()
                                  const pct = Math.min(100, Math.max(0, ((dueTime - start!.getTime()) / (end!.getTime() - start!.getTime())) * 100))
                                  return (
                                    <div
                                      key={d.id}
                                      title={`${d.name} — ${new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${d.status})`}
                                      style={{
                                        position: 'absolute', left: `calc(${pct}% - 6px)`, top: '20px',
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        background: sColor(d.status), border: '2px solid #fff',
                                        boxShadow: '0 0 0 1px ' + sColor(d.status), cursor: 'default',
                                      }}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#8a9199', marginBottom: '20px' }}>
                              Set a Start and End date in the Overview tab to see the visual timeline.
                            </p>
                          )}
                          <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                            Deliverables by Due Date
                          </h3>
                          {sorted.length === 0 && undated.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#8a9199' }}>No deliverables yet.</p>
                          ) : (
                            <div style={{ display: 'grid', gap: '6px' }}>
                              {sorted.map((d: any) => (
                                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: '#fff', border: '1px solid #CCCCCC', borderRadius: '6px' }}>
                                  <span style={{ width: '78px', flexShrink: 0, fontSize: '11px', color: '#697077' }}>
                                    {new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <span style={{ flex: 1, fontSize: '12px', color: '#323E48' }}>{d.name}</span>
                                  <span style={{ fontSize: '10px', color: '#8a9199' }}>{d.category}</span>
                                  <span style={{
                                    fontSize: '9.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '3px',
                                    textTransform: 'uppercase' as const, letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif',
                                    background: sBg(d.status), color: sColor(d.status)
                                  }}>
                                    {d.status}
                                  </span>
                                </div>
                              ))}
                              {undated.length > 0 && (
                                <p style={{ fontSize: '10.5px', color: '#aab0b5', marginTop: '4px' }}>
                                  +{undated.length} deliverable{undated.length !== 1 ? 's' : ''} without a due date (set one in the Deliverables tab)
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
                {/* DELIVERABLES */}
                {activeTab === 'deliverables' && (
"""

OLD_DELIVERABLES_START = """                {/* DELIVERABLES */}
                {activeTab === 'deliverables' && (
"""

apply_one(
    PAGE_PATH,
    OLD_DELIVERABLES_START,
    NEW_TIMELINE_PANEL,
    "page: insert Timeline tab panel before Deliverables",
)

print("\nAll patches applied successfully.")
