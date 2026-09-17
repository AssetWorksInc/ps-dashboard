#!/usr/bin/env python3
"""
Patch: rename the customer-visible "SOP Checklist" heading in the
Documents tab to "Project Checklist" -- the second item flagged in the
9/17 customer-safe-language audit. Labels only: no change to the
underlying checklist items, admin-only Add Item control, or the SQL
table/column names (still sop_items / sopItems internally).

Run from the repo root: python3 patch_project_checklist_heading.py
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


apply_one(
    PAGE_PATH,
    "                {/* DOCUMENTS (folded in: SOP Checklist + Reference Documents) */}\n",
    "                {/* DOCUMENTS (folded in: Project Checklist, formerly \"SOP Checklist\" + Reference Documents) */}\n",
    "documents: update folded-tab code comment",
)

apply_one(
    PAGE_PATH,
    """                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                      SOP Checklist
                    </h3>
""",
    """                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                      Project Checklist
                    </h3>
""",
    "documents: rename SOP Checklist heading to Project Checklist",
)

print("\nAll patches applied successfully.")
