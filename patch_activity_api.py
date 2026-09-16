#!/usr/bin/env python3
"""
Patch: expose `created_at` on five entity queries in the projects GET
endpoint (Deliverables, Customer Contacts, Budget line items, Billing
charges, SOP items) so the new Activity tab can build a derived,
reverse-chronological "what's new" feed without any new table. All five
columns already exist in the database (each query already ORDER BYs on
created_at) — this just adds them to the SELECT list. Documents, Meeting
Notes, and Tasks already expose created_at and need no change. Appointments
is deliberately left out: a scheduled_at is a future event, not "activity,"
and the appointments query doesn't currently reference created_at at all.

Run from the repo root: python3 patch_activity_api.py
Safe to re-run: each anchor is matched exactly once; if already applied,
this will fail loudly instead of double-patching.
"""
import sys

ROUTE_PATH = "app/api/projects/route.ts"


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
    ROUTE_PATH,
    "      `SELECT id, project_id, category, name, status, due_date, owner\n"
    "       FROM deliverables\n",
    "      `SELECT id, project_id, category, name, status, due_date, owner, created_at\n"
    "       FROM deliverables\n",
    "route: add created_at to deliverables",
)

apply_one(
    ROUTE_PATH,
    "      `SELECT id, project_id, name, role, email, phone, is_primary\n"
    "       FROM project_contacts\n",
    "      `SELECT id, project_id, name, role, email, phone, is_primary, created_at\n"
    "       FROM project_contacts\n",
    "route: add created_at to contacts",
)

apply_one(
    ROUTE_PATH,
    "      `SELECT id, project_id, activity_name, hours_planned, hours_worked, sort_order\n"
    "       FROM budget_line_items\n",
    "      `SELECT id, project_id, activity_name, hours_planned, hours_worked, sort_order, created_at\n"
    "       FROM budget_line_items\n",
    "route: add created_at to budget line items",
)

apply_one(
    ROUTE_PATH,
    "      `SELECT id, project_id, description, hours, rate, amount, charge_date, source\n"
    "       FROM billing_charges\n",
    "      `SELECT id, project_id, description, hours, rate, amount, charge_date, source, created_at\n"
    "       FROM billing_charges\n",
    "route: add created_at to billing charges",
)

apply_one(
    ROUTE_PATH,
    "      `SELECT id, project_id, title, description, status, due_date, sort_order, checked_by, checked_at\n"
    "       FROM sop_items\n",
    "      `SELECT id, project_id, title, description, status, due_date, sort_order, checked_by, checked_at, created_at\n"
    "       FROM sop_items\n",
    "route: add created_at to sop items",
)

print("\nAll patches applied successfully.")
