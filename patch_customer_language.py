#!/usr/bin/env python3
"""
Patch: relabel the customer-visible "NetSuite Data" sub-section of the
Budget tab for client-appropriate wording. This is a labels-only change --
it does not touch which data is shown or the isAdmin gating on Import
NetSuite Report / Clear NetSuite Data (those stay admin-only, and keep
their existing labels since only admins see them).

Changes:
  - Section heading: "NetSuite Data" -> "Delivery Detail"
  - Tile label: "Prime Resource" -> "Project Lead"
  - Empty state: "No NetSuite data imported for this project yet."
      -> "No delivery detail available for this project yet."
  - Tile sub-label: "from NetSuite rollup" -> "rollup total"

Run from the repo root: python3 patch_customer_language.py
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


# 1. Section heading + its code comment.
apply_one(
    PAGE_PATH,
    """                    {/* NetSuite Data (folded in from the old standalone NetSuite Report tab) */}
                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #EAECEE' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>
                          NetSuite Data
                        </h3>
""",
    """                    {/* DELIVERY DETAIL (formerly "NetSuite Data" -- relabeled for customer-facing clarity, still fed by NetSuite imports) */}
                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #EAECEE' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>
                          Delivery Detail
                        </h3>
""",
    "budget: rename NetSuite Data heading to Delivery Detail",
)

# 2. "Prime Resource" tile label.
apply_one(
    PAGE_PATH,
    "                          { label: 'Prime Resource', value: dfirst.prime_resource, sub: 'assigned lead' },\n",
    "                          { label: 'Project Lead', value: dfirst.prime_resource, sub: 'assigned lead' },\n",
    "budget: rename Prime Resource tile to Project Lead",
)

# 3. Empty-state copy.
apply_one(
    PAGE_PATH,
    """                              No NetSuite data imported for this project yet.
""",
    """                              No delivery detail available for this project yet.
""",
    "budget: reword empty-state NetSuite message",
)

# 4. "from NetSuite rollup" sub-label.
apply_one(
    PAGE_PATH,
    "                          { label: 'Planned Hours', value: first.project_planned_hours, sub: 'from NetSuite rollup' },\n",
    "                          { label: 'Planned Hours', value: first.project_planned_hours, sub: 'rollup total' },\n",
    "budget: reword Planned Hours tile sub-label",
)

print("\nAll patches applied successfully.")
