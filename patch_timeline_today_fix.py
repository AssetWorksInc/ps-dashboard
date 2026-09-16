#!/usr/bin/env python3
"""
Patch: fix the Timeline tab's "Today" marker label colliding with the
date-range labels row above the track. Previously the label sat at
top: '-16px' relative to the marker line, which pushes it ABOVE the track
and into the same vertical space as the "Sep 16, 2026" / end-date labels
row directly above. Fix: render the label INSIDE the top of the track
itself as a small red pill with white text (readable regardless of what's
behind it), and clamp its horizontal position near the 0%/100% edges so it
doesn't get clipped off the left/right side of the track when today's date
is very close to the start or end of the range.

Run from the repo root: python3 patch_timeline_today_fix.py
Safe to re-run: the anchor is matched exactly once; if already applied,
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


OLD_TODAY_MARKER = """                                {todayPct !== null && (
                                  <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: '2px', background: '#A50021', zIndex: 2 }} title="Today">
                                    <span style={{ position: 'absolute', top: '-16px', left: '-14px', fontSize: '9px', fontWeight: 700, color: '#A50021', fontFamily: 'Oswald, sans-serif' }}>Today</span>
                                  </div>
                                )}
"""

NEW_TODAY_MARKER = """                                {todayPct !== null && (
                                  <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: '2px', background: '#A50021', zIndex: 2 }} title="Today">
                                    <span style={{
                                      position: 'absolute',
                                      top: '4px',
                                      left: todayPct < 8 ? '4px' : todayPct > 92 ? 'auto' : '50%',
                                      right: todayPct > 92 ? '4px' : 'auto',
                                      transform: todayPct < 8 || todayPct > 92 ? 'none' : 'translateX(-50%)',
                                      fontSize: '9px', fontWeight: 700, color: '#fff', background: '#A50021',
                                      padding: '1px 6px', borderRadius: '3px', whiteSpace: 'nowrap' as const,
                                      fontFamily: 'Oswald, sans-serif', zIndex: 3,
                                    }}>Today</span>
                                  </div>
                                )}
"""

apply_one(
    PAGE_PATH,
    OLD_TODAY_MARKER,
    NEW_TODAY_MARKER,
    "page: move Today label inside track, clamp near edges",
)

print("\nAll patches applied successfully.")
