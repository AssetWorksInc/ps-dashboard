#!/usr/bin/env python3
"""
Patch: add the new "Tasks" tab (Kanban: To Do / In Progress / Waiting on
Customer / Done) to Project Center, backed by the new project_tasks table.
Run patch_tasks_tab_sql.sql (or the equivalent node one-liner) FIRST so the
table exists before this app code goes live.

Run from the repo root: python3 patch_tasks_tab.py
Safe to re-run: each anchor is matched exactly once; if a previous run
already applied, this will fail loudly instead of double-patching.
"""
import sys

PAGE_PATH = "app/projects/page.tsx"
API_PATH = "app/api/projects/route.ts"


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


# ---------------------------------------------------------------------------
# 1. app/api/projects/route.ts — add a projectTasks query (same tenant-scope
#    pattern as deliverables/contacts/etc.) and include it in the response.
# ---------------------------------------------------------------------------
apply_one(
    API_PATH,
    """    const deliverables = await pool.query(
      `SELECT id, project_id, category, name, status, due_date, owner
       FROM deliverables
       ${scope}
       ORDER BY created_at ASC`,
      params
    )""",
    """    const deliverables = await pool.query(
      `SELECT id, project_id, category, name, status, due_date, owner
       FROM deliverables
       ${scope}
       ORDER BY created_at ASC`,
      params
    )
    const projectTasks = await pool.query(
      `SELECT id, project_id, title, description, status, assignee, due_date, created_at
       FROM project_tasks
       ${scope}
       ORDER BY created_at ASC`,
      params
    )""",
    "api/projects: add projectTasks query",
)

apply_one(
    API_PATH,
    "      deliverables: deliverables.rows,\n",
    "      deliverables: deliverables.rows,\n"
    "      projectTasks: projectTasks.rows,\n",
    "api/projects: include projectTasks in response",
)

# ---------------------------------------------------------------------------
# 2. app/projects/page.tsx
# ---------------------------------------------------------------------------

# 2a. Tasks tab state, right after the Deliverables tab state block.
apply_one(
    PAGE_PATH,
    """  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null)
  const [deliverableDraft, setDeliverableDraft] = useState<any>({})
""",
    """  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null)
  const [deliverableDraft, setDeliverableDraft] = useState<any>({})
  // Tasks tab state
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', assignee: '', due_date: '', status: 'todo' })
""",
    "page: add Tasks tab state",
)

# 2b. Derived per-project task list, next to the existing `deliverables` line.
apply_one(
    PAGE_PATH,
    "  const deliverables = data?.deliverables?.filter((d: any) => d.project_id === selectedProject?.id) || []\n",
    "  const deliverables = data?.deliverables?.filter((d: any) => d.project_id === selectedProject?.id) || []\n"
    "  const tasks = data?.projectTasks?.filter((t: any) => t.project_id === selectedProject?.id) || []\n",
    "page: derive tasks from data.projectTasks",
)

# 2c. Tab bar entry, right after Overview.
apply_one(
    PAGE_PATH,
    "    { id: 'overview', label: 'Overview' },\n",
    "    { id: 'overview', label: 'Overview' },\n"
    "    { id: 'tasks', label: 'Tasks' },\n",
    "page: add Tasks tab bar entry",
)

# 2d. create/update/delete functions, right after deleteDeliverable.
apply_one(
    PAGE_PATH,
    """  async function deleteDeliverable(id: string) {
    if (!confirm('Delete this deliverable?')) return
    const res = await fetch(`/api/deliverables/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }
""",
    """  async function deleteDeliverable(id: string) {
    if (!confirm('Delete this deliverable?')) return
    const res = await fetch(`/api/deliverables/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }
  async function createTask() {
    if (!newTask.title.trim()) return
    const res = await fetch('/api/project-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        title: newTask.title,
        assignee: newTask.assignee || null,
        due_date: newTask.due_date || null,
        status: newTask.status || 'todo',
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingTask(false)
      setNewTask({ title: '', assignee: '', due_date: '', status: 'todo' })
    }
  }
  async function updateTaskStatus(id: string, status: string) {
    const res = await fetch(`/api/project-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await res.json()
    if (result.success) await loadProjects()
  }
  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    const res = await fetch(`/api/project-tasks/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }
""",
    "page: add createTask/updateTaskStatus/deleteTask",
)

# 2e. The tab panel itself — inserted right before the Deliverables panel.
NEW_TASKS_PANEL = """                {/* TASKS */}
                {activeTab === 'tasks' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      {isAdmin && !addingTask && (
                        <button
                          onClick={() => setAddingTask(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Task
                        </button>
                      )}
                    </div>
                    {addingTask && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
                        <input
                          placeholder="Task title*"
                          value={newTask.title}
                          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          autoFocus
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Assignee"
                            value={newTask.assignee}
                            onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            type="date"
                            value={newTask.due_date}
                            onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <select
                            value={newTask.status}
                            onChange={e => setNewTask({ ...newTask, status: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_on_customer">Waiting on Customer</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={createTask}
                            disabled={!newTask.title.trim()}
                            style={{ padding: '7px 14px', background: !newTask.title.trim() ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: !newTask.title.trim() ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingTask(false); setNewTask({ title: '', assignee: '', due_date: '', status: 'todo' }) }}
                            style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {[
                        { id: 'todo', label: 'To Do', accent: '#00538C' },
                        { id: 'in_progress', label: 'In Progress', accent: '#A50021' },
                        { id: 'waiting_on_customer', label: 'Waiting on Customer', accent: '#8a6400' },
                        { id: 'done', label: 'Done', accent: '#2E7D32' },
                      ].map(col => {
                        const colTasks = tasks.filter((t: any) => t.status === col.id)
                        return (
                          <div key={col.id} style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.4px', color: col.accent }}>
                                {col.label}
                              </span>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#8a9199' }}>{colTasks.length}</span>
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {colTasks.length === 0 && (
                                <p style={{ fontSize: '11px', color: '#aab0b5', textAlign: 'center', padding: '10px 0' }}>No tasks</p>
                              )}
                              {colTasks.map((t: any) => {
                                const overdue = t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date(new Date().toDateString())
                                return (
                                  <div key={t.id} style={{ background: '#fff', border: '1px solid #CCCCCC', borderTop: `3px solid ${col.accent}`, borderRadius: '6px', padding: '9px 10px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#323E48', margin: '0 0 6px' }}>{t.title}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '4px' }}>
                                      <span style={{ fontSize: '10.5px', color: '#697077' }}>{t.assignee || '—'}</span>
                                      {t.due_date && (
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: overdue ? '#A50021' : '#8a9199' }}>
                                          {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                    {isAdmin && (
                                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                        <select
                                          value={t.status}
                                          onChange={e => updateTaskStatus(t.id, e.target.value)}
                                          style={{ flex: 1, fontSize: '10.5px', padding: '4px 6px', border: '1px solid #CCCCCC', borderRadius: '4px' }}
                                        >
                                          <option value="todo">To Do</option>
                                          <option value="in_progress">In Progress</option>
                                          <option value="waiting_on_customer">Waiting on Customer</option>
                                          <option value="done">Done</option>
                                        </select>
                                        <button
                                          onClick={() => deleteTask(t.id)}
                                          title="Delete task"
                                          style={{ padding: '4px 8px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '10.5px', cursor: 'pointer' }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* DELIVERABLES */}
                {activeTab === 'deliverables' && (
"""

OLD_DELIVERABLES_START = """                {/* DELIVERABLES */}
                {activeTab === 'deliverables' && (
"""

apply_one(
    PAGE_PATH,
    OLD_DELIVERABLES_START,
    NEW_TASKS_PANEL,
    "page: insert Tasks tab panel before Deliverables",
)

print("\nAll patches applied successfully.")
