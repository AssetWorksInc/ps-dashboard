#!/usr/bin/env python3
"""
Patch: make the Overview "Key Contacts" preview and the Timeline
"Deliverables by Due Date" list jump to their full tabs instead of just
being static text. This doesn't move any functionality or remove either
standalone tab (Deliverables and Customer Contacts keep their Add/Edit/
Delete forms) -- it just fixes the dead-end where a preview mentioned the
full tab by name but gave you nothing to click. Schedule is untouched --
it's a separate meeting/appointment calendar, not a preview of anything.

Run from the repo root: python3 patch_tab_links.py
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


# 1. Overview: turn the Key Contacts preview footer into a clickable link
# to the Customer Contacts tab (shown any time there's at least one
# contact, not just when there are more than 4).
OLD_CONTACTS_LINK = """                        {contacts.length > 4 && (
                          <p style={{ fontSize: '10.5px', color: '#8a9199', marginTop: '6px' }}>
                            +{contacts.length - 4} more in Customer Contacts \u2192
                          </p>
                        )}
"""

NEW_CONTACTS_LINK = """                        <button
                          onClick={() => setActiveTab('contacts')}
                          style={{ display: 'block', background: 'none', border: 'none', padding: 0, marginTop: '6px', fontSize: '10.5px', color: '#00538C', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {contacts.length > 4 ? `+${contacts.length - 4} more in Customer Contacts \u2192` : 'View all in Customer Contacts \u2192'}
                        </button>
"""

apply_one(
    PAGE_PATH,
    OLD_CONTACTS_LINK,
    NEW_CONTACTS_LINK,
    "overview: make Key Contacts preview link to Contacts tab",
)

# 2. Timeline: add a "Manage in Deliverables" link next to the
# "Deliverables by Due Date" heading.
OLD_DELIVERABLES_HEADING = """                          <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                            Deliverables by Due Date
                          </h3>
"""

NEW_DELIVERABLES_HEADING = """                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '.5px', color: '#A50021', margin: 0 }}>
                              Deliverables by Due Date
                            </h3>
                            <button
                              onClick={() => setActiveTab('deliverables')}
                              style={{ background: 'none', border: 'none', padding: 0, fontSize: '10.5px', color: '#00538C', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Manage in Deliverables \u2192
                            </button>
                          </div>
"""

apply_one(
    PAGE_PATH,
    OLD_DELIVERABLES_HEADING,
    NEW_DELIVERABLES_HEADING,
    "timeline: add Manage in Deliverables link",
)

print("\nAll patches applied successfully.")
