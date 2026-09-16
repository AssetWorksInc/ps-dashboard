#!/usr/bin/env python3
"""
Patch: rename the "Status Meeting Notes" tab to "Notes" — the seventh and
final tab of the unified 7-tab Project workspace (Overview, Tasks, Timeline,
Budget, Documents, Activity, Notes). Pure rename: no data change, no new
table, no new API route, and no change to the note-taking form itself
(title, meeting date, status update, risks & decisions, monitor & control,
rich-text notes) — only the tab bar label and the activeTab id change.

Run from the repo root: python3 patch_notes_tab.py
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


# 1. Rename the tab bar entry.
apply_one(
    PAGE_PATH,
    "    { id: 'meetingNotes', label: 'Status Meeting Notes' },\n",
    "    { id: 'notes', label: 'Notes' },\n",
    "page: rename Status Meeting Notes tab bar entry to Notes",
)

# 2. Rename the comment and activeTab check.
apply_one(
    PAGE_PATH,
    "                {/* STATUS MEETING NOTES */}\n"
    "                {activeTab === 'meetingNotes' && (\n",
    "                {/* NOTES (renamed from Status Meeting Notes) */}\n"
    "                {activeTab === 'notes' && (\n",
    "page: rename meetingNotes activeTab check to notes",
)

print("\nAll patches applied successfully.")
