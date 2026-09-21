#!/usr/bin/env python3
"""
Follow-up to patch_activity_netsuite_sync.py, caught before it could bite on a
real import: the Budget tab's "Hours Used" tile already had a rule that the
moment ANY Hours-by-Activity line item exists for a project, the tile stops
showing NetSuite's rollup (budget_hours_used) and switches to summing the
line items' Worked Hours instead. Before today that only affected the small
number of projects a PM had hand-added an activity line to. The NetSuite-
mirroring feature just shipped auto-creates a line item (Worked Hours
starting at 0) for every task with a NetSuite ID on every future Activity
Detail import -- so the very next re-import of ANY project would trip this
switchover and silently show Hours Used as 0 instead of the real rollup,
undoing the Budget Utilization fix from a few days ago.

Fix: only let the tile switch over to the line-item total when a line item
is genuinely PM-driven -- added by hand (source != 'netsuite'), or a
NetSuite-mirrored row a PM has actually edited (manual_override). Untouched,
NetSuite-mirrored rows are ignored for this decision, so the tile keeps
trusting the rollup until a person actually overrides something.

Run from the repo root: python3 patch_hours_used_switchover.py
Safe to re-run: the anchor is matched exactly once; if already applied, this
will fail loudly instead of double-patching.
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


apply_one(
    PAGE_PATH,
    """  const hoursUsedFromItems = lineItems.reduce((sum: number, li: any) => sum + (Number(li.hours_worked) || 0), 0)
  const hoursUsed = lineItems.length > 0 ? hoursUsedFromItems : (Number(selectedProject?.budget_hours_used) || 0)""",
    """  // Only line items a person actually drove -- hand-added, or a NetSuite-mirrored
  // row someone has edited -- count toward "there's real manual data here." An
  // untouched NetSuite-mirrored row (source: 'netsuite', not yet overridden) is
  // ignored for this check, so importing NetSuite tasks alone never flips Hours
  // Used away from the trusted rollup; only a person's own entry does.
  const manualLineItems = lineItems.filter((li: any) => li.source !== 'netsuite' || li.manual_override)
  const hoursUsedFromItems = manualLineItems.reduce((sum: number, li: any) => sum + (Number(li.hours_worked) || 0), 0)
  const hoursUsed = manualLineItems.length > 0 ? hoursUsedFromItems : (Number(selectedProject?.budget_hours_used) || 0)""",
    "page: Hours Used only switches to line items on genuine manual entry",
)

print("\nAll patches applied successfully.")
