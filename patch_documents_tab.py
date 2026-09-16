#!/usr/bin/env python3
"""
Patch: rename the "SOP Checklist" tab to "Documents", per the tab-consolidation
plan (SOP Checklist + its Reference Documents section become the Documents
tab). No new table, no new API route, no data change — this tab already
contained both the checklist and its attached reference documents (uploaded
via the existing /api/upload with category='SOP'), so this is a rename plus
a small heading added above the checklist so it reads as a labeled
sub-section within the new, more general "Documents" tab.

Three changes:
  1. Rename the tab bar entry from "SOP Checklist" to "Documents".
  2. Rename the code comment and activeTab check from 'sop' to 'documents'.
  3. Add a "SOP Checklist" heading above the checklist progress bar, so the
     checklist reads as one labeled section and "Reference Documents"
     (already labeled) reads as the other, within the single Documents tab.

Run from the repo root: python3 patch_documents_tab.py
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
    "    { id: 'sop', label: 'SOP Checklist' },\n",
    "    { id: 'documents', label: 'Documents' },\n",
    "page: rename SOP Checklist tab bar entry to Documents",
)

# 2. Rename the comment and activeTab check.
apply_one(
    PAGE_PATH,
    "                {/* SOP CHECKLIST */}\n"
    "                {activeTab === 'sop' && (\n"
    "                  <div>\n"
    "                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>\n"
    "                      <span style={{ fontSize: '10px', color: '#8a9199', fontWeight: 600 }}>\n"
    "                        Checklist Progress",
    "                {/* DOCUMENTS (folded in: SOP Checklist + Reference Documents) */}\n"
    "                {activeTab === 'documents' && (\n"
    "                  <div>\n"
    "                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>\n"
    "                      SOP Checklist\n"
    "                    </h3>\n"
    "                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>\n"
    "                      <span style={{ fontSize: '10px', color: '#8a9199', fontWeight: 600 }}>\n"
    "                        Checklist Progress",
    "page: rename sop tab to documents, add SOP Checklist sub-heading",
)

print("\nAll patches applied successfully.")
