#!/usr/bin/env python3
"""
Patch: add the "Activity" tab — the seventh and final new tab of the
unified 7-tab Project workspace. Derived feed, no new table: merges
Tasks, Deliverables, Budget line items, Billing charges, SOP items,
Documents, Meeting Notes, and Contacts (all already returned by
/api/projects, now each carrying created_at) into one reverse-chronological
list of "what's new" for the project. Appointments are deliberately left
out — a scheduled_at is a future event, not something that recently
happened. This only shows creation events, not edits or status changes,
since nothing records those yet; the tab says so explicitly.

Run from the repo root: python3 patch_activity_tab.py
Safe to re-run: each anchor is matched exactly once; if already applied,
this will fail loudly instead of double-patching.
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


# 1. Tab bar entry, right before Notes.
apply_one(
    PAGE_PATH,
    "    { id: 'schedule', label: 'Schedule' },\n"
    "    { id: 'notes', label: 'Notes' },\n",
    "    { id: 'schedule', label: 'Schedule' },\n"
    "    { id: 'activity', label: 'Activity' },\n"
    "    { id: 'notes', label: 'Notes' },\n",
    "page: add Activity tab bar entry",
)

# 2. The tab panel itself, inserted right before the Notes panel.
OLD_NOTES_START = """                {/* NOTES (renamed from Status Meeting Notes) */}
                {activeTab === 'notes' && (
"""

NEW_ACTIVITY_PANEL = """                {/* ACTIVITY */}
                {activeTab === 'activity' && (
                  <div>
                    <p style={{ fontSize: '10.5px', color: '#8a9199', marginBottom: '14px' }}>
                      Shows items added to this project, most recent first. Edits and status changes aren't tracked yet — only new items.
                    </p>
                    {(() => {
                      const pid = selectedProject.id
                      const events: { id: string; type: string; icon: string; color: string; title: string; meta: string; created_at: string }[] = []
                      ;(data?.projectTasks || []).filter((t: any) => t.project_id === pid && t.created_at).forEach((t: any) => {
                        events.push({ id: `task-${t.id}`, type: 'Task', icon: '📋', color: '#00538C', title: t.title, meta: t.assignee ? `Task created · assigned to ${t.assignee}` : 'Task created', created_at: t.created_at })
                      })
                      ;(data?.deliverables || []).filter((d: any) => d.project_id === pid && d.created_at).forEach((d: any) => {
                        events.push({ id: `deliverable-${d.id}`, type: 'Deliverable', icon: '📦', color: '#2E7D32', title: d.name, meta: d.category ? `Deliverable added · ${d.category}` : 'Deliverable added', created_at: d.created_at })
                      })
                      ;(data?.budgetLineItems || []).filter((b: any) => b.project_id === pid && b.created_at).forEach((b: any) => {
                        events.push({ id: `budget-${b.id}`, type: 'Budget', icon: '💰', color: '#8a6400', title: b.activity_name, meta: 'Budget activity added', created_at: b.created_at })
                      })
                      ;(data?.billingCharges || []).filter((c: any) => c.project_id === pid && c.created_at).forEach((c: any) => {
                        events.push({ id: `billing-${c.id}`, type: 'Billing', icon: '🧾', color: '#A50021', title: c.description, meta: c.amount != null ? `Billing charge logged · ${fmtMoney(Number(c.amount))}` : 'Billing charge logged', created_at: c.created_at })
                      })
                      ;(data?.sopItems || []).filter((s: any) => s.project_id === pid && s.created_at).forEach((s: any) => {
                        events.push({ id: `sop-${s.id}`, type: 'SOP', icon: '✅', color: '#697077', title: s.title, meta: 'SOP checklist item added', created_at: s.created_at })
                      })
                      ;(data?.documents || []).filter((doc: any) => doc.project_id === pid && doc.created_at).forEach((doc: any) => {
                        events.push({ id: `document-${doc.id}`, type: 'Document', icon: '📄', color: '#00538C', title: doc.title, meta: doc.uploaded_by ? `Document uploaded · by ${doc.uploaded_by}` : 'Document uploaded', created_at: doc.created_at })
                      })
                      ;(data?.meetingNotes || []).filter((n: any) => n.project_id === pid && n.created_at).forEach((n: any) => {
                        events.push({ id: `note-${n.id}`, type: 'Note', icon: '📝', color: '#8a6400', title: n.title, meta: n.author ? `Status meeting note added · by ${n.author}` : 'Status meeting note added', created_at: n.created_at })
                      })
                      ;(data?.contacts || []).filter((c: any) => c.project_id === pid && c.created_at).forEach((c: any) => {
                        events.push({ id: `contact-${c.id}`, type: 'Contact', icon: '👤', color: '#697077', title: c.name, meta: c.role ? `Contact added · ${c.role}` : 'Contact added', created_at: c.created_at })
                      })
                      events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      const recent = events.slice(0, 100)
                      if (recent.length === 0) {
                        return (
                          <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px' }}>
                            No activity recorded for this project yet.
                          </p>
                        )
                      }
                      return (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {recent.map(e => (
                            <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: '#fff', border: '1px solid #EAECEE', borderLeft: `3px solid ${e.color}`, borderRadius: '6px' }}>
                              <span style={{ fontSize: '16px', flexShrink: 0 }}>{e.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#323E48', margin: 0 }}>{e.title || 'Untitled'}</p>
                                <p style={{ fontSize: '10.5px', color: '#8a9199', margin: '2px 0 0' }}>{e.meta}</p>
                              </div>
                              <span style={{ fontSize: '10px', color: '#aab0b5', flexShrink: 0, whiteSpace: 'nowrap' }} title={new Date(e.created_at).toLocaleString()}>
                                {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}
                {/* NOTES (renamed from Status Meeting Notes) */}
                {activeTab === 'notes' && (
"""

apply_one(
    PAGE_PATH,
    OLD_NOTES_START,
    NEW_ACTIVITY_PANEL,
    "page: insert Activity tab panel before Notes",
)

print("\nAll patches applied successfully.")
