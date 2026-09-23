#!/usr/bin/env python3
"""
Phase 0 of the Management Center Activity feed: wires the new Activity page
into navigation and adds the collapsed "N updates today" badge to the
Dashboard (Option C from the design review with Erich). The activity_log
table itself is created by migrate_activity_log.js, and lib/activityLog.ts /
app/api/admin/activity/route.ts / app/management/activity/page.tsx are new
files delivered alongside this patch -- nothing to patch for those, they're
full new files.

The feed will show "Nothing matches yet" until Phase 1 (instrumenting
Project Center's write paths) lands right after this deploy -- expected,
not a bug.

Run from the repo root: python3 patch_activity_phase0.py
Safe to re-run: each anchor is matched exactly once; if already applied,
this will fail loudly instead of double-patching.
"""
import sys

SIDEBAR_PATH = "components/Sidebar.tsx"
DASHBOARD_PATH = "app/management/page.tsx"


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


# --------------------------------------------------------------------------
# 1. Sidebar: add "Activity" link under Management Center, after Tickets
# --------------------------------------------------------------------------

apply_one(
    SIDEBAR_PATH,
    """              <span style={{ fontSize: '16px' }}>🎫</span>
              <span>Tickets</span>
            </Link>
            <div style={{
              padding: '14px 18px 6px',
              fontSize: '9px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#697077',
              fontWeight: 700,
              fontFamily: 'Oswald, sans-serif'
            }}>
              Professional Services
            </div>""",
    """              <span style={{ fontSize: '16px' }}>🎫</span>
              <span>Tickets</span>
            </Link>
            <Link
              href="/management/activity"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 18px',
                fontSize: '12px',
                fontWeight: pathname === '/management/activity' ? 600 : 400,
                color: pathname === '/management/activity' ? '#ffffff' : '#8a9199',
                background: pathname === '/management/activity' ? 'rgba(165,0,33,0.2)' : 'transparent',
                borderLeft: pathname === '/management/activity' ? '3px solid #A50021' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              <span style={{ fontSize: '16px' }}>🕘</span>
              <span>Activity</span>
            </Link>
            <div style={{
              padding: '14px 18px 6px',
              fontSize: '9px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#697077',
              fontWeight: 700,
              fontFamily: 'Oswald, sans-serif'
            }}>
              Professional Services
            </div>""",
    "Sidebar: add Activity link under Management Center",
)

# --------------------------------------------------------------------------
# 2. Dashboard: fetch today's activity count
# --------------------------------------------------------------------------

apply_one(
    DASHBOARD_PATH,
    """export default function ManagementDashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/portfolio')""",
    """export default function ManagementDashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activityToday, setActivityToday] = useState<number | null>(null)

  useEffect(() => {
    // Lightweight -- the same endpoint the Activity page uses, asked for
    // just enough rows to read back its counts.today figure.
    fetch('/api/admin/activity?limit=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.counts) setActivityToday(Number(d.counts.today) || 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/portfolio')""",
    "Dashboard: fetch today's activity count",
)

# --------------------------------------------------------------------------
# 3. Dashboard: collapsed activity badge between KPI tiles and main content
# --------------------------------------------------------------------------

apply_one(
    DASHBOARD_PATH,
    """      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: 0 }}>Needs a look today</h2>""",
    """      <Link
        href="/management/activity"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none',
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px',
          padding: '10px 16px', marginBottom: '14px',
        }}
      >
        <span
          style={{
            fontFamily: 'Oswald, sans-serif', fontWeight: 700, fontSize: '11px', color: '#fff',
            background: '#00538C', borderRadius: '999px', padding: '2px 10px', minWidth: '18px', textAlign: 'center',
          }}
        >
          {activityToday === null ? '…' : activityToday}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: INK }}>
          updates today across Project Center, Portfolio, Resource Center, and Collaboration Hub
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: MUTED, fontFamily: 'Oswald, sans-serif', fontWeight: 700 }}>
          View activity →
        </span>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13.5px', margin: 0 }}>Needs a look today</h2>""",
    "Dashboard: collapsed activity badge (Option C placement)",
)

print("\nAll patches applied successfully.")
