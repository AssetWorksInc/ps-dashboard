#!/usr/bin/env python3
"""
Patch: rename the Tasks board's "Waiting on Customer" status label to
"Action Needed" -- the third and final item from the 9/17 customer-safe-
language audit. This is a display-label-only change: the underlying
status value stored in the database and used in code stays
`waiting_on_customer` (the Kanban column id, the <option value=...>, and
the task.status comparisons are all untouched) -- only the text a person
reads changes, in all three places it appears: the "Add Task" status
dropdown, the Kanban column header, and the per-task edit dropdown.

Chosen wording is deliberately neutral (not "Waiting on You" / "Waiting
on Customer") because this single label is shown to admins and
customers alike with no per-role branching -- a second-person label
would read backwards for an admin looking at the same board.

Note: the "Add Task" dropdown option and the per-task edit dropdown
option render identical visible text at different indentation levels
(28 vs 42 leading spaces). Each anchor below includes the preceding
sibling <option> line (with its own indentation) as extra context, and
is anchored with a leading "\n", so it can't accidentally match as a
substring of the other, more-indented copy.

Run from the repo root: python3 patch_task_status_label.py
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


# 1. "Add Task" status dropdown option (28-space indent). Anchored with
# the preceding "In Progress" sibling line, both indented at 28 spaces,
# and a leading newline so it can't match as a tail-substring of the
# more deeply indented per-task edit dropdown (anchor #3 below).
apply_one(
    PAGE_PATH,
    '\n                            <option value="in_progress">In Progress</option>\n'
    '                            <option value="waiting_on_customer">Waiting on Customer</option>\n',
    '\n                            <option value="in_progress">In Progress</option>\n'
    '                            <option value="waiting_on_customer">Action Needed</option>\n',
    "tasks: relabel Add Task dropdown option",
)

# 2. Kanban column definition.
apply_one(
    PAGE_PATH,
    "                        { id: 'waiting_on_customer', label: 'Waiting on Customer', accent: '#8a6400' },\n",
    "                        { id: 'waiting_on_customer', label: 'Action Needed', accent: '#8a6400' },\n",
    "tasks: relabel Kanban column header",
)

# 3. Per-task edit dropdown option (42-space indent), same anchoring
# approach as #1.
apply_one(
    PAGE_PATH,
    '\n                                          <option value="in_progress">In Progress</option>\n'
    '                                          <option value="waiting_on_customer">Waiting on Customer</option>\n',
    '\n                                          <option value="in_progress">In Progress</option>\n'
    '                                          <option value="waiting_on_customer">Action Needed</option>\n',
    "tasks: relabel per-task edit dropdown option",
)

print("\nAll patches applied successfully.")
