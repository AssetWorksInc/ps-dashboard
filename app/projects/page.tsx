'use client'
import { useEffect, useState } from 'react'
import NotesEditor from '@/components/NotesEditor'
export default function ProjectCenter() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('status')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', pm_name: '', start_date: '', end_date: '' })

  // Budget tab state
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [editingBudgetSettings, setEditingBudgetSettings] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState<any>({ budget_hours_total: '', hourly_rate: '', budget_status: 'green' })
  const [addingLineItem, setAddingLineItem] = useState(false)
  const [newLineItem, setNewLineItem] = useState({ activity_name: '', hours_planned: '', hours_worked: '' })
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null)
  const [lineItemDraft, setLineItemDraft] = useState<any>({})
  const [addingCharge, setAddingCharge] = useState(false)
  const [newCharge, setNewCharge] = useState({ description: '', hours: '', rate: '', amount: '', charge_date: '' })
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null)
  const [chargeDraft, setChargeDraft] = useState<any>({})

  // SOP checklist tab state
  const [addingSopItem, setAddingSopItem] = useState(false)
  const [newSopItem, setNewSopItem] = useState({ title: '', description: '', due_date: '' })
  const [editingSopItemId, setEditingSopItemId] = useState<string | null>(null)
  const [sopItemDraft, setSopItemDraft] = useState<any>({})

  // SOP reference document attachment state
  const [addingSopDoc, setAddingSopDoc] = useState(false)
  const [sopDocTitle, setSopDocTitle] = useState('')
  const [sopDocFile, setSopDocFile] = useState<File | null>(null)
  const [uploadingSopDoc, setUploadingSopDoc] = useState(false)

  // Schedule tab state
  const [addingAppt, setAddingAppt] = useState(false)
  const [newAppt, setNewAppt] = useState({ title: '', session_type: '', consultant: '', scheduled_at: '', location: '', notes: '' })
  const [editingApptId, setEditingApptId] = useState<string | null>(null)
  const [apptDraft, setApptDraft] = useState<any>({})

  // Deliverables tab state
  const [addingDeliverable, setAddingDeliverable] = useState(false)
  const [newDeliverable, setNewDeliverable] = useState({ name: '', category: '', owner: '', due_date: '', status: 'upcoming' })
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null)
  const [deliverableDraft, setDeliverableDraft] = useState<any>({})

  // Customer Contacts tab state
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '', is_primary: false })
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState<any>({})

  // Status Meeting Notes tab state
  const emptyMeetingNote = {
    title: '', body: '', meeting_date: '', risks_decisions: '', monitor_control: '',
    attendees: '', action_items: '',
    customer_satisfaction: 'na', scope_status: 'na', budget_quality_status: 'na', on_time_status: 'na', notes: ''
  }
  const [addingMeetingNote, setAddingMeetingNote] = useState(false)
  const [newMeetingNote, setNewMeetingNote] = useState<any>(emptyMeetingNote)
  const [editingMeetingNoteId, setEditingMeetingNoteId] = useState<string | null>(null)
  const [meetingNoteDraft, setMeetingNoteDraft] = useState<any>({})
  const [openMeetingNoteId, setOpenMeetingNoteId] = useState<string | null>(null)

  function loadProjects() {
    return fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        setData(d)
        return d
      })
  }

  useEffect(() => {
    loadProjects()
      .then(d => {
        if (d.projects?.length > 0) setSelectedProject(d.projects[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const isAdmin = !!data?.isAdmin

  async function createProject() {
    if (!newProject.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })
      const result = await res.json()
      if (result.success) {
        const d = await loadProjects()
        const created = d.projects?.find((p: any) => p.id === result.project.id)
        setSelectedProject(created || result.project)
        setShowNewProject(false)
        setNewProject({ name: '', description: '', pm_name: '', start_date: '', end_date: '' })
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading projects...</p>
    </div>
  )
  const hColor = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#8a6400' : '#A50021'
  const hBg = (h: string) => h === 'green' ? '#E7F3E8' : h === 'amber' ? '#FDF3DC' : '#FBE7EA'
  const hDot = (h: string) => h === 'green' ? '#2E7D32' : h === 'amber' ? '#F2A900' : '#A50021'
  const hLabel = (h: string) => h === 'green' ? 'On Track' : h === 'amber' ? 'At Risk' : 'Critical'
  const sColor = (s: string) => s === 'done' ? '#2E7D32' : s === 'in-progress' ? '#A50021' : s === 'scheduled' ? '#00538C' : '#8a6400'
  const sBg = (s: string) => s === 'done' ? '#E7F3E8' : s === 'in-progress' ? '#FBE7EA' : s === 'scheduled' ? '#E9F1F7' : '#FDF3DC'
  const pill = (h: string) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '10px', fontWeight: 600, padding: '2px 9px',
      borderRadius: '999px', fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase' as const, letterSpacing: '.4px',
      background: hBg(h), color: hColor(h)
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: hDot(h), display: 'inline-block' }} />
      {hLabel(h)}
    </span>
  )
  const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const toDateTimeLocal = (d: string | null | undefined) => {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }
  const sopColor = (s: string) => s === 'complete' ? '#2E7D32' : s === 'in-progress' ? '#A50021' : '#8a6400'
  const sopBg = (s: string) => s === 'complete' ? '#E7F3E8' : s === 'in-progress' ? '#FBE7EA' : '#FDF3DC'
  const sopLabel = (s: string) => s === 'complete' ? 'Complete' : s === 'in-progress' ? 'In Progress' : 'Not Started'
  const deliverables = data?.deliverables?.filter((d: any) => d.project_id === selectedProject?.id) || []
  const contacts = data?.contacts?.filter((c: any) => c.project_id === selectedProject?.id) || []
  const appointments = data?.appointments?.filter((a: any) => a.project_id === selectedProject?.id) || []
  const lineItems = data?.budgetLineItems?.filter((li: any) => li.project_id === selectedProject?.id) || []
  const charges = data?.billingCharges?.filter((c: any) => c.project_id === selectedProject?.id) || []
  const sopItems = data?.sopItems?.filter((s: any) => s.project_id === selectedProject?.id) || []
  const sopCompleteCount = sopItems.filter((s: any) => s.status === 'complete').length
  const sopPct = sopItems.length > 0 ? Math.round((sopCompleteCount / sopItems.length) * 100) : 0
  const sopDocuments = data?.documents?.filter((d: any) => d.project_id === selectedProject?.id && d.category === 'SOP') || []
  const meetingNotes = data?.meetingNotes?.filter((m: any) => m.project_id === selectedProject?.id) || []
  const statusColor = (s: string) => s === 'green' ? '#2E7D32' : s === 'yellow' ? '#8a6400' : s === 'red' ? '#A50021' : '#8a9199'
  const statusBg = (s: string) => s === 'green' ? '#E7F3E8' : s === 'yellow' ? '#FDF3DC' : s === 'red' ? '#FBE7EA' : '#F4F5F6'
  const statusLabel = (s: string) => s === 'green' ? 'On Track' : s === 'yellow' ? 'At Risk' : s === 'red' ? 'Critical' : 'N/A'
  const docIcon = (t: string) => t === 'pdf' ? '📄' : (t === 'doc' || t === 'docx') ? '📝' : (t === 'xls' || t === 'xlsx') ? '📊' : (t === 'ppt' || t === 'pptx') ? '📈' : '📁'
  const hoursTotal = Number(selectedProject?.budget_hours_total) || 0
  const hoursUsedFromItems = lineItems.reduce((sum: number, li: any) => sum + (Number(li.hours_worked) || 0), 0)
  const hoursUsed = lineItems.length > 0 ? hoursUsedFromItems : (Number(selectedProject?.budget_hours_used) || 0)
  const hoursRemaining = Math.max(hoursTotal - hoursUsed, 0)
  const hourlyRate = Number(selectedProject?.hourly_rate) || 0
  const valueUsed = hoursUsed * hourlyRate
  const valueRemaining = hoursRemaining * hourlyRate
  const totalBilled = charges.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
  const pctUsed = hoursTotal > 0 ? Math.min(Math.round((hoursUsed / hoursTotal) * 100), 100) : 0
  const tabs = [
    { id: 'status', label: 'Project Status' },
    { id: 'deliverables', label: 'Deliverables' },
    { id: 'budget', label: 'Budget' },
    { id: 'sop', label: 'SOP Checklist' },
    { id: 'contacts', label: 'Customer Contacts' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'meetingNotes', label: 'Status Meeting Notes' },
  ]
  const handleSave = async (health: string, status: string) => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/projects/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProject.id, health, status })
      })
      const result = await res.json()
      if (result.success) {
        setSelectedProject({ ...selectedProject, health, status })
        setData((prev: any) => ({
          ...prev,
          projects: prev.projects.map((p: any) =>
            p.id === selectedProject.id ? { ...p, health, status } : p
          )
        }))
        setSaveMessage({ type: 'success', text: '✅ Project updated successfully.' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: '❌ Update failed. Please try again.' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: '❌ Something went wrong.' })
    }
    setSaving(false)
  }

  async function saveBudgetSettings() {
    setBudgetSaving(true)
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_hours_total: budgetDraft.budget_hours_total === '' ? null : Number(budgetDraft.budget_hours_total),
          hourly_rate: budgetDraft.hourly_rate === '' ? null : Number(budgetDraft.hourly_rate),
          budget_status: budgetDraft.budget_status,
        }),
      })
      const result = await res.json()
      if (result.success) {
        const d = await loadProjects()
        const updated = d.projects?.find((p: any) => p.id === selectedProject.id)
        if (updated) setSelectedProject(updated)
        setEditingBudgetSettings(false)
      }
    } finally {
      setBudgetSaving(false)
    }
  }

  async function createLineItem() {
    if (!newLineItem.activity_name.trim()) return
    const res = await fetch('/api/budget-line-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        activity_name: newLineItem.activity_name,
        hours_planned: newLineItem.hours_planned === '' ? 0 : Number(newLineItem.hours_planned),
        hours_worked: newLineItem.hours_worked === '' ? 0 : Number(newLineItem.hours_worked),
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingLineItem(false)
      setNewLineItem({ activity_name: '', hours_planned: '', hours_worked: '' })
    }
  }

  async function saveLineItem(id: string) {
    const res = await fetch(`/api/budget-line-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_name: lineItemDraft.activity_name,
        hours_planned: lineItemDraft.hours_planned === '' ? 0 : Number(lineItemDraft.hours_planned),
        hours_worked: lineItemDraft.hours_worked === '' ? 0 : Number(lineItemDraft.hours_worked),
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingLineItemId(null)
    }
  }

  async function deleteLineItem(id: string) {
    if (!confirm('Delete this budget line item?')) return
    const res = await fetch(`/api/budget-line-items/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function createCharge() {
    if (!newCharge.description.trim()) return
    const res = await fetch('/api/billing-charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        description: newCharge.description,
        hours: newCharge.hours === '' ? null : Number(newCharge.hours),
        rate: newCharge.rate === '' ? null : Number(newCharge.rate),
        amount: newCharge.amount === '' ? null : Number(newCharge.amount),
        charge_date: newCharge.charge_date || null,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingCharge(false)
      setNewCharge({ description: '', hours: '', rate: '', amount: '', charge_date: '' })
    }
  }

  async function saveCharge(id: string) {
    const res = await fetch(`/api/billing-charges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: chargeDraft.description,
        hours: chargeDraft.hours === '' ? null : Number(chargeDraft.hours),
        rate: chargeDraft.rate === '' ? null : Number(chargeDraft.rate),
        amount: chargeDraft.amount === '' ? null : Number(chargeDraft.amount),
        charge_date: chargeDraft.charge_date || null,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingChargeId(null)
    }
  }

  async function deleteCharge(id: string) {
    if (!confirm('Delete this billing charge?')) return
    const res = await fetch(`/api/billing-charges/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function toggleSopItem(item: any) {
    const nextStatus = item.status === 'complete' ? 'not-started' : 'complete'
    const res = await fetch(`/api/sop-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function createSopItem() {
    if (!newSopItem.title.trim()) return
    const res = await fetch('/api/sop-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        title: newSopItem.title,
        description: newSopItem.description || null,
        due_date: newSopItem.due_date || null,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingSopItem(false)
      setNewSopItem({ title: '', description: '', due_date: '' })
    }
  }

  async function saveSopItem(id: string) {
    const res = await fetch(`/api/sop-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sopItemDraft.title,
        description: sopItemDraft.description || null,
        due_date: sopItemDraft.due_date || null,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingSopItemId(null)
    }
  }

  async function deleteSopItem(id: string) {
    if (!confirm('Delete this checklist item?')) return
    const res = await fetch(`/api/sop-items/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function uploadSopDocument() {
    if (!sopDocFile) return
    setUploadingSopDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', sopDocFile)
      formData.append('title', sopDocTitle || sopDocFile.name)
      formData.append('category', 'SOP')
      formData.append('project_id', selectedProject.id)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (result.success) {
        await loadProjects()
        setAddingSopDoc(false)
        setSopDocTitle('')
        setSopDocFile(null)
      }
    } finally {
      setUploadingSopDoc(false)
    }
  }

  async function deleteSopDocument(id: string) {
    if (!confirm('Delete this document?')) return
    const res = await fetch('/api/documents/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function createAppointment() {
    if (!newAppt.title.trim() || !newAppt.scheduled_at) return
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        title: newAppt.title,
        session_type: newAppt.session_type || null,
        consultant: newAppt.consultant || null,
        scheduled_at: newAppt.scheduled_at ? new Date(newAppt.scheduled_at).toISOString() : null,
        location: newAppt.location || null,
        notes: newAppt.notes || null,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingAppt(false)
      setNewAppt({ title: '', session_type: '', consultant: '', scheduled_at: '', location: '', notes: '' })
    }
  }

  async function saveAppointment(id: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: apptDraft.title,
        session_type: apptDraft.session_type || null,
        consultant: apptDraft.consultant || null,
        scheduled_at: apptDraft.scheduled_at ? new Date(apptDraft.scheduled_at).toISOString() : null,
        location: apptDraft.location || null,
        notes: apptDraft.notes || null,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingApptId(null)
    }
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Delete this appointment?')) return
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function createDeliverable() {
    if (!newDeliverable.name.trim() || !newDeliverable.category.trim()) return
    const res = await fetch('/api/deliverables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        name: newDeliverable.name,
        category: newDeliverable.category,
        owner: newDeliverable.owner || null,
        due_date: newDeliverable.due_date || null,
        status: newDeliverable.status || 'upcoming',
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingDeliverable(false)
      setNewDeliverable({ name: '', category: '', owner: '', due_date: '', status: 'upcoming' })
    }
  }

  async function saveDeliverable(id: string) {
    const res = await fetch(`/api/deliverables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: deliverableDraft.name,
        category: deliverableDraft.category,
        owner: deliverableDraft.owner || null,
        due_date: deliverableDraft.due_date || null,
        status: deliverableDraft.status,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingDeliverableId(null)
    }
  }

  async function deleteDeliverable(id: string) {
    if (!confirm('Delete this deliverable?')) return
    const res = await fetch(`/api/deliverables/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  async function createContact() {
    if (!newContact.name.trim()) return
    const res = await fetch('/api/project-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        name: newContact.name,
        role: newContact.role || null,
        email: newContact.email || null,
        phone: newContact.phone || null,
        is_primary: newContact.is_primary,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingContact(false)
      setNewContact({ name: '', role: '', email: '', phone: '', is_primary: false })
    }
  }

  async function saveContact(id: string) {
    const res = await fetch(`/api/project-contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactDraft.name,
        role: contactDraft.role || null,
        email: contactDraft.email || null,
        phone: contactDraft.phone || null,
        is_primary: !!contactDraft.is_primary,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingContactId(null)
    }
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    const res = await fetch(`/api/project-contacts/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  function splitList(v: string): string[] {
    return String(v || '').split(',').map(s => s.trim()).filter(Boolean)
  }
  function joinList(v: any): string {
    return Array.isArray(v) ? v.join(', ') : ''
  }

  async function createMeetingNote() {
    if (!newMeetingNote.title.trim()) return
    const res = await fetch('/api/meeting-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        title: newMeetingNote.title,
        body: newMeetingNote.body || null,
        meeting_date: newMeetingNote.meeting_date || null,
        risks_decisions: newMeetingNote.risks_decisions || null,
        monitor_control: newMeetingNote.monitor_control || null,
        notes: meetingNoteDraft.notes || null,
        attendees: splitList(newMeetingNote.attendees),
        action_items: splitList(newMeetingNote.action_items),
        customer_satisfaction: newMeetingNote.customer_satisfaction,
        scope_status: newMeetingNote.scope_status,
        budget_quality_status: newMeetingNote.budget_quality_status,
        on_time_status: newMeetingNote.on_time_status,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setAddingMeetingNote(false)
      setNewMeetingNote(emptyMeetingNote)
    }
  }

  async function saveMeetingNote(id: string) {
    const res = await fetch(`/api/meeting-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: meetingNoteDraft.title,
        body: meetingNoteDraft.body || null,
        meeting_date: meetingNoteDraft.meeting_date || null,
        risks_decisions: meetingNoteDraft.risks_decisions || null,
        monitor_control: meetingNoteDraft.monitor_control || null,
        attendees: splitList(meetingNoteDraft.attendees),
        action_items: splitList(meetingNoteDraft.action_items),
        customer_satisfaction: meetingNoteDraft.customer_satisfaction,
        scope_status: meetingNoteDraft.scope_status,
        budget_quality_status: meetingNoteDraft.budget_quality_status,
        on_time_status: meetingNoteDraft.on_time_status,
      }),
    })
    const result = await res.json()
    if (result.success) {
      await loadProjects()
      setEditingMeetingNoteId(null)
    }
  }

  async function deleteMeetingNote(id: string) {
    if (!confirm('Delete this status meeting note?')) return
    const res = await fetch(`/api/meeting-notes/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await loadProjects()
  }

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Top bar */}
    <div style={{
  background: '#ffffff',
  borderBottom: '4px solid #A50021',
  padding: '14px 150px 14px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
      }}>
        <div>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '16px', color: '#323E48' }}>
            Project Center
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Active engagements · deliverables · budget · contacts · schedules
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#697077' }}>
            {data?.projects?.length || 0} active project{data?.projects?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div style={{ padding: '24px 28px 60px' }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Active Projects', value: data?.projects?.length || 0, color: '#A50021' },
            { label: 'On Track', value: data?.projects?.filter((p: any) => p.health === 'green').length || 0, color: '#2E7D32' },
            { label: 'At Risk', value: data?.projects?.filter((p: any) => p.health === 'amber').length || 0, color: '#8a6400' },
            { label: 'Total Deliverables', value: data?.deliverables?.length || 0, color: '#00538C' },
          ].map((k, i) => (
            <div key={i} style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderTop: `4px solid ${k.color}`,
              borderRadius: '8px', padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(50,62,72,.08)'
            }}>
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '6px' }}>
                {k.label}
              </div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
        {/* Split panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          {/* Left — engagement list */}
          <div style={{
            background: '#ffffff', border: '1px solid #CCCCCC',
            borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#323E48',
              borderBottom: '1px solid #CCCCCC',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                Active Engagements
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowNewProject(!showNewProject)}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '2px 8px', fontFamily: 'Oswald, sans-serif' }}
                >
                  + New
                </button>
              )}
            </div>
            {showNewProject && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #EAECEE', background: '#F4F5F6', display: 'grid', gap: '8px' }}>
                <input
                  placeholder="Project name*"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                  autoFocus
                />
                <input
                  placeholder="Description"
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                />
                <input
                  placeholder="PM name"
                  value={newProject.pm_name}
                  onChange={e => setNewProject({ ...newProject, pm_name: e.target.value })}
                  style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={e => setNewProject({ ...newProject, start_date: e.target.value })}
                    style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                  />
                  <input
                    type="date"
                    value={newProject.end_date}
                    onChange={e => setNewProject({ ...newProject, end_date: e.target.value })}
                    style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={createProject}
                    disabled={creating || !newProject.name.trim()}
                    style={{ flex: 1, padding: '7px', background: creating ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: creating ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    onClick={() => setShowNewProject(false)}
                    style={{ padding: '7px 12px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {(!data?.projects || data.projects.length === 0) && !showNewProject && (
              <div style={{ padding: '30px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#8a9199', marginBottom: '10px' }}>No projects yet.</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowNewProject(true)}
                    style={{ padding: '7px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}
                  >
                    + Create First Project
                  </button>
                )}
              </div>
            )}
            {data?.projects?.map((p: any) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); setActiveTab('status') }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderLeft: `4px solid ${selectedProject?.id === p.id ? '#A50021' : 'transparent'}`,
                  borderBottom: '1px solid #EAECEE',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: selectedProject?.id === p.id ? '#FBE7EA' : '#ffffff',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#323E48', lineHeight: 1.4, paddingRight: '6px' }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontSize: '8px', padding: '2px 6px', borderRadius: '3px', fontWeight: 700,
                    background: hBg(p.health), color: hColor(p.health),
                    fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    {p.health === 'green' ? 'On Track' : p.health === 'amber' ? 'At Risk' : 'Critical'}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: '#8a9199', marginBottom: '6px' }}>PM: {p.pm_name}</p>
                <div style={{ height: '5px', background: '#EAECEE', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.pct_complete}%`, background: '#A50021', borderRadius: '3px' }} />
                </div>
                <p style={{ fontSize: '9px', color: '#8a9199', marginTop: '3px' }}>{p.pct_complete}% complete</p>
              </button>
            ))}
          </div>
          {/* Right — detail panel */}
          {selectedProject && (
            <div style={{
              background: '#ffffff', border: '1px solid #CCCCCC',
              borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
              overflow: 'hidden'
            }}>
              {/* Project header */}
              <div style={{
                padding: '18px 22px',
                background: '#323E48',
                borderBottom: '1px solid #CCCCCC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '4px', fontFamily: 'Oswald, sans-serif' }}>
                      {selectedProject.name}
                    </h2>
                    <p style={{ fontSize: '11px', color: '#8a9199' }}>PM: {selectedProject.pm_name}</p>
                  </div>
                  {pill(selectedProject.health)}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#8a9199' }}>Overall Progress</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>{selectedProject.pct_complete}%</span>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedProject.pct_complete}%`, background: '#A50021', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #CCCCCC', background: '#F4F5F6' }}>
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: '11px 18px', fontSize: '12px',
                      fontFamily: 'Oswald, sans-serif', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '.3px',
                      color: activeTab === t.id ? '#A50021' : '#697077',
                      background: 'none', border: 'none',
                      borderBottom: activeTab === t.id ? '3px solid #A50021' : '3px solid transparent',
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {/* Tab content */}
              <div style={{ padding: '20px 22px' }}>
                {/* STATUS */}
                {activeTab === 'status' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#697077', lineHeight: 1.7, marginBottom: '20px' }}>
                      {selectedProject.description || 'No description available.'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                      {[
                        { label: 'Status', value: selectedProject.status || 'Active' },
                        { label: 'Start Date', value: selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
                        { label: 'End Date', value: selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px 14px' }}>
                          <p style={{ fontSize: '9px', color: '#8a9199', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Oswald, sans-serif' }}>{s.label}</p>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', marginBottom: '10px' }}>
                      Deliverable Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '24px' }}>
                      {['done', 'in-progress', 'scheduled', 'upcoming'].map(s => (
                        <div key={s} style={{ background: sBg(s), border: `1px solid ${sColor(s)}33`, borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '22px', fontWeight: 700, color: sColor(s) }}>
                            {deliverables.filter((d: any) => d.status === s).length}
                          </div>
                          <div style={{ fontSize: '9px', color: sColor(s), fontWeight: 700, textTransform: 'uppercase', marginTop: '2px', fontFamily: 'Oswald, sans-serif' }}>{s}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#F4F5F6', borderRadius: '8px', padding: '16px 18px', border: '1px solid #CCCCCC' }}>
                      <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, color: '#323E48', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>
                        ✏️ Update Project
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>
                            Health
                          </label>
                          <select
                            id="health-select"
                            defaultValue={selectedProject.health}
                            key={selectedProject.id + '-health'}
                            style={{ width: '100%', padding: '9px 12px', fontSize: '12px', border: '1px solid #CCCCCC', borderRadius: '6px', color: '#323E48', background: '#ffffff', cursor: 'pointer' }}
                          >
                            <option value="green">🟢 On Track</option>
                            <option value="amber">🟡 At Risk</option>
                            <option value="red">🔴 Critical</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>
                            Status
                          </label>
                          <select
                            id="status-select"
                            defaultValue={selectedProject.status}
                            key={selectedProject.id + '-status'}
                            style={{ width: '100%', padding: '9px 12px', fontSize: '12px', border: '1px solid #CCCCCC', borderRadius: '6px', color: '#323E48', background: '#ffffff', cursor: 'pointer' }}
                          >
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="complete">Complete</option>
                          </select>
                        </div>
                      </div>
                      {saveMessage && (
                        <div style={{
                          padding: '10px 14px', borderRadius: '6px', marginBottom: '10px',
                          fontSize: '12px', fontWeight: 600,
                          background: saveMessage.type === 'success' ? '#E7F3E8' : '#FBE7EA',
                          color: saveMessage.type === 'success' ? '#2E7D32' : '#A50021',
                          border: `1px solid ${saveMessage.type === 'success' ? '#a3d9a5' : '#f5c6cb'}`
                        }}>
                          {saveMessage.text}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const health = (document.getElementById('health-select') as HTMLSelectElement)?.value
                          const status = (document.getElementById('status-select') as HTMLSelectElement)?.value
                          handleSave(health, status)
                        }}
                        disabled={saving}
                        style={{
                          width: '100%', padding: '10px',
                          background: saving ? '#C9CFD4' : '#A50021',
                          color: '#ffffff', border: 'none', borderRadius: '6px',
                          fontFamily: 'Oswald, sans-serif', fontSize: '13px',
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
                          cursor: saving ? 'default' : 'pointer'
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
                {/* DELIVERABLES */}
                {activeTab === 'deliverables' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      {isAdmin && !addingDeliverable && (
                        <button
                          onClick={() => setAddingDeliverable(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Deliverable
                        </button>
                      )}
                    </div>
                    {addingDeliverable && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Deliverable name*"
                            value={newDeliverable.name}
                            onChange={e => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            autoFocus
                          />
                          <input
                            placeholder="Category*"
                            value={newDeliverable.category}
                            onChange={e => setNewDeliverable({ ...newDeliverable, category: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Owner"
                            value={newDeliverable.owner}
                            onChange={e => setNewDeliverable({ ...newDeliverable, owner: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            type="date"
                            value={newDeliverable.due_date}
                            onChange={e => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <select
                            value={newDeliverable.status}
                            onChange={e => setNewDeliverable({ ...newDeliverable, status: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={createDeliverable}
                            disabled={!newDeliverable.name.trim() || !newDeliverable.category.trim()}
                            style={{ padding: '7px 14px', background: (!newDeliverable.name.trim() || !newDeliverable.category.trim()) ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: (!newDeliverable.name.trim() || !newDeliverable.category.trim()) ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingDeliverable(false); setNewDeliverable({ name: '', category: '', owner: '', due_date: '', status: 'upcoming' }) }}
                            style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          {['Deliverable', 'Category', 'Due', 'Owner', 'Status', ...(isAdmin ? ['Actions'] : [])].map(h => (
                            <th key={h} style={{
                              background: '#323E48', color: '#ffffff',
                              fontFamily: 'Oswald, sans-serif', fontWeight: 600,
                              textAlign: 'left', padding: '8px 10px',
                              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px'
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deliverables.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin ? 6 : 5} style={{ padding: '20px', textAlign: 'center', color: '#8a9199', fontSize: '12px' }}>
                              No deliverables found for this project.
                            </td>
                          </tr>
                        ) : deliverables.map((d: any, i: number) => (
                          <tr key={d.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#F4F5F6' }}>
                            {editingDeliverableId === d.id ? (
                              <>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input value={deliverableDraft.name} onChange={e => setDeliverableDraft({ ...deliverableDraft, name: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input value={deliverableDraft.category} onChange={e => setDeliverableDraft({ ...deliverableDraft, category: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="date" value={deliverableDraft.due_date ? String(deliverableDraft.due_date).slice(0, 10) : ''} onChange={e => setDeliverableDraft({ ...deliverableDraft, due_date: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input value={deliverableDraft.owner || ''} onChange={e => setDeliverableDraft({ ...deliverableDraft, owner: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <select value={deliverableDraft.status} onChange={e => setDeliverableDraft({ ...deliverableDraft, status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }}>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="done">Done</option>
                                  </select>
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                                  <button onClick={() => saveDeliverable(d.id)} style={{ marginRight: '6px', padding: '4px 10px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                  <button onClick={() => setEditingDeliverableId(null)} style={{ padding: '4px 10px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 500 }}>
                                  {d.name}
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>
                                  {d.category}
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>
                                  {d.due_date ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                      width: '20px', height: '20px', borderRadius: '50%',
                                      background: '#1F3864', color: '#fff',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '9px', fontWeight: 700, fontFamily: 'Oswald, sans-serif'
                                    }}>
                                      {d.owner?.split(' ').map((n: string) => n[0]).join('') || 'AW'}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#323E48' }}>{d.owner}</span>
                                  </div>
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px' }}>
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                    borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '.3px',
                                    fontFamily: 'Oswald, sans-serif',
                                    background: sBg(d.status), color: sColor(d.status)
                                  }}>
                                    {d.status}
                                  </span>
                                </td>
                                {isAdmin && (
                                  <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                                    <button onClick={() => { setEditingDeliverableId(d.id); setDeliverableDraft({ name: d.name, category: d.category, owner: d.owner, due_date: d.due_date, status: d.status }) }} style={{ marginRight: '6px', padding: '4px 10px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                                    <button onClick={() => deleteDeliverable(d.id)} style={{ padding: '4px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* BUDGET */}
                {activeTab === 'budget' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '16px' }}>
                      {[
                        { label: 'Budgeted Hours', value: hoursTotal.toLocaleString(), color: '#323E48' },
                        { label: 'Hours Used', value: hoursUsed.toLocaleString(), color: '#00538C' },
                        { label: 'Hours Remaining', value: hoursRemaining.toLocaleString(), color: '#2E7D32' },
                        { label: 'Value Used', value: fmtMoney(valueUsed), color: '#8a6400' },
                        { label: 'Value Remaining', value: fmtMoney(valueRemaining), color: '#2E7D32' },
                      ].map((k, i) => (
                        <div key={i} style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px 14px' }}>
                          <p style={{ fontSize: '9px', color: '#8a9199', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Oswald, sans-serif' }}>{k.label}</p>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: k.color, fontFamily: 'Oswald, sans-serif' }}>{k.value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#8a9199', fontWeight: 600 }}>Budget Utilization — {pctUsed}%</span>
                      {pill(selectedProject.budget_status || 'green')}
                    </div>
                    <div style={{ height: '8px', background: '#EAECEE', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ height: '100%', width: `${pctUsed}%`, background: pctUsed >= 90 ? '#A50021' : pctUsed >= 70 ? '#F2A900' : '#2E7D32', borderRadius: '4px' }} />
                    </div>

                    {/* Budget settings editor */}
                    <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingBudgetSettings ? '12px' : 0 }}>
                        <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, color: '#323E48', textTransform: 'uppercase', letterSpacing: '.5px', margin: 0 }}>
                          ⚙️ Budget Settings
                        </p>
                        {isAdmin && !editingBudgetSettings && (
                          <button
                            onClick={() => {
                              setBudgetDraft({
                                budget_hours_total: selectedProject.budget_hours_total ?? '',
                                hourly_rate: selectedProject.hourly_rate ?? '',
                                budget_status: selectedProject.budget_status || 'green',
                              })
                              setEditingBudgetSettings(true)
                            }}
                            style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingBudgetSettings ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Total Budgeted Hours</label>
                            <input
                              type="number"
                              value={budgetDraft.budget_hours_total}
                              onChange={e => setBudgetDraft({ ...budgetDraft, budget_hours_total: e.target.value })}
                              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Hourly Rate ($)</label>
                            <input
                              type="number"
                              value={budgetDraft.hourly_rate}
                              onChange={e => setBudgetDraft({ ...budgetDraft, hourly_rate: e.target.value })}
                              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Budget Status</label>
                            <select
                              value={budgetDraft.budget_status}
                              onChange={e => setBudgetDraft({ ...budgetDraft, budget_status: e.target.value })}
                              style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            >
                              <option value="green">🟢 On Budget</option>
                              <option value="amber">🟡 Watch</option>
                              <option value="red">🔴 Over Budget</option>
                            </select>
                          </div>
                          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '6px' }}>
                            <button
                              onClick={saveBudgetSettings}
                              disabled={budgetSaving}
                              style={{ padding: '7px 14px', background: budgetSaving ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: budgetSaving ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                            >
                              {budgetSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingBudgetSettings(false)}
                              style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '11px', color: '#697077', margin: 0 }}>
                          {hourlyRate > 0 ? `$${hourlyRate}/hr` : 'No hourly rate set'} · {hoursTotal > 0 ? `${hoursTotal} budgeted hours` : 'No hour budget set'}
                        </p>
                      )}
                    </div>

                    {/* Line items */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>
                        Hours by Activity
                      </h3>
                      {isAdmin && !addingLineItem && (
                        <button
                          onClick={() => setAddingLineItem(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Activity
                        </button>
                      )}
                    </div>
                    {addingLineItem && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '12px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto auto', gap: '8px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Activity Name</label>
                          <input value={newLineItem.activity_name} onChange={e => setNewLineItem({ ...newLineItem, activity_name: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} autoFocus />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Planned Hrs</label>
                          <input type="number" value={newLineItem.hours_planned} onChange={e => setNewLineItem({ ...newLineItem, hours_planned: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Worked Hrs</label>
                          <input type="number" value={newLineItem.hours_worked} onChange={e => setNewLineItem({ ...newLineItem, hours_worked: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                        </div>
                        <button onClick={createLineItem} style={{ padding: '7px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>Add</button>
                        <button onClick={() => { setAddingLineItem(false); setNewLineItem({ activity_name: '', hours_planned: '', hours_worked: '' }) }} style={{ padding: '7px 12px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '28px' }}>
                      <thead>
                        <tr>
                          {['Activity', 'Planned Hrs', 'Worked Hrs', 'Remaining', ...(isAdmin ? ['Actions'] : [])].map(h => (
                            <th key={h} style={{ background: '#323E48', color: '#ffffff', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textAlign: 'left', padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin ? 5 : 4} style={{ padding: '20px', textAlign: 'center', color: '#8a9199', fontSize: '12px' }}>
                              No budget line items yet.
                            </td>
                          </tr>
                        ) : lineItems.map((li: any, i: number) => (
                          <tr key={li.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#F4F5F6' }}>
                            {editingLineItemId === li.id ? (
                              <>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input value={lineItemDraft.activity_name} onChange={e => setLineItemDraft({ ...lineItemDraft, activity_name: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="number" value={lineItemDraft.hours_planned} onChange={e => setLineItemDraft({ ...lineItemDraft, hours_planned: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="number" value={lineItemDraft.hours_worked} onChange={e => setLineItemDraft({ ...lineItemDraft, hours_worked: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>
                                  {(Number(lineItemDraft.hours_planned || 0) - Number(lineItemDraft.hours_worked || 0)).toFixed(1)}
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                                  <button onClick={() => saveLineItem(li.id)} style={{ marginRight: '6px', padding: '4px 10px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                  <button onClick={() => setEditingLineItemId(null)} style={{ padding: '4px 10px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 500 }}>{li.activity_name}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{Number(li.hours_planned).toFixed(1)}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{Number(li.hours_worked).toFixed(1)}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{(Number(li.hours_planned) - Number(li.hours_worked)).toFixed(1)}</td>
                                {isAdmin && (
                                  <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                                    <button onClick={() => { setEditingLineItemId(li.id); setLineItemDraft({ activity_name: li.activity_name, hours_planned: li.hours_planned, hours_worked: li.hours_worked }) }} style={{ marginRight: '6px', padding: '4px 10px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                                    <button onClick={() => deleteLineItem(li.id)} style={{ padding: '4px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Billing charges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>
                        Billing Log — {fmtMoney(totalBilled)} total
                      </h3>
                      {isAdmin && !addingCharge && (
                        <button
                          onClick={() => setAddingCharge(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Charge
                        </button>
                      )}
                    </div>
                    {addingCharge && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '12px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto auto', gap: '8px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Description</label>
                          <input value={newCharge.description} onChange={e => setNewCharge({ ...newCharge, description: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} autoFocus />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Date</label>
                          <input type="date" value={newCharge.charge_date} onChange={e => setNewCharge({ ...newCharge, charge_date: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Hours</label>
                          <input type="number" value={newCharge.hours} onChange={e => setNewCharge({ ...newCharge, hours: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Rate ($)</label>
                          <input type="number" value={newCharge.rate} onChange={e => setNewCharge({ ...newCharge, rate: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Amount ($)</label>
                          <input type="number" placeholder="auto" value={newCharge.amount} onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                        </div>
                        <button onClick={createCharge} style={{ padding: '7px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>Add</button>
                        <button onClick={() => { setAddingCharge(false); setNewCharge({ description: '', hours: '', rate: '', amount: '', charge_date: '' }) }} style={{ padding: '7px 12px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          {['Description', 'Date', 'Hours', 'Rate', 'Amount', ...(isAdmin ? ['Actions'] : [])].map(h => (
                            <th key={h} style={{ background: '#323E48', color: '#ffffff', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textAlign: 'left', padding: '8px 10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {charges.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin ? 6 : 5} style={{ padding: '20px', textAlign: 'center', color: '#8a9199', fontSize: '12px' }}>
                              No billing charges logged yet.
                            </td>
                          </tr>
                        ) : charges.map((c: any, i: number) => (
                          <tr key={c.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#F4F5F6' }}>
                            {editingChargeId === c.id ? (
                              <>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input value={chargeDraft.description} onChange={e => setChargeDraft({ ...chargeDraft, description: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="date" value={chargeDraft.charge_date ? String(chargeDraft.charge_date).slice(0, 10) : ''} onChange={e => setChargeDraft({ ...chargeDraft, charge_date: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="number" value={chargeDraft.hours ?? ''} onChange={e => setChargeDraft({ ...chargeDraft, hours: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="number" value={chargeDraft.rate ?? ''} onChange={e => setChargeDraft({ ...chargeDraft, rate: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px' }}>
                                  <input type="number" value={chargeDraft.amount ?? ''} onChange={e => setChargeDraft({ ...chargeDraft, amount: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '5px 7px', border: '1px solid #CCCCCC', borderRadius: '4px' }} />
                                </td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                                  <button onClick={() => saveCharge(c.id)} style={{ marginRight: '6px', padding: '4px 10px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                  <button onClick={() => setEditingChargeId(null)} style={{ padding: '4px 10px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 500 }}>{c.description}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{c.charge_date ? new Date(c.charge_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{c.hours != null ? Number(c.hours).toFixed(1) : '—'}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#697077' }}>{c.rate != null ? `$${Number(c.rate).toFixed(2)}` : '—'}</td>
                                <td style={{ borderBottom: '1px solid #CCCCCC', padding: '9px 10px', fontSize: '12px', color: '#323E48', fontWeight: 700 }}>{c.amount != null ? fmtMoney(Number(c.amount)) : '—'}</td>
                                {isAdmin && (
                                  <td style={{ borderBottom: '1px solid #CCCCCC', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                                    <button onClick={() => { setEditingChargeId(c.id); setChargeDraft({ description: c.description, hours: c.hours, rate: c.rate, amount: c.amount, charge_date: c.charge_date }) }} style={{ marginRight: '6px', padding: '4px 10px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                                    <button onClick={() => deleteCharge(c.id)} style={{ padding: '4px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* SOP CHECKLIST */}
                {activeTab === 'sop' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#8a9199', fontWeight: 600 }}>
                        Checklist Progress — {sopCompleteCount} of {sopItems.length} complete ({sopPct}%)
                      </span>
                      {isAdmin && !addingSopItem && (
                        <button
                          onClick={() => setAddingSopItem(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Item
                        </button>
                      )}
                    </div>
                    <div style={{ height: '8px', background: '#EAECEE', borderRadius: '4px', overflow: 'hidden', marginBottom: '18px' }}>
                      <div style={{ height: '100%', width: `${sopPct}%`, background: '#2E7D32', borderRadius: '4px' }} />
                    </div>
                    {addingSopItem && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
                        <input
                          placeholder="Checklist item title*"
                          value={newSopItem.title}
                          onChange={e => setNewSopItem({ ...newSopItem, title: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          autoFocus
                        />
                        <input
                          placeholder="Description (optional)"
                          value={newSopItem.description}
                          onChange={e => setNewSopItem({ ...newSopItem, description: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                        />
                        <input
                          type="date"
                          value={newSopItem.due_date}
                          onChange={e => setNewSopItem({ ...newSopItem, due_date: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={createSopItem}
                            disabled={!newSopItem.title.trim()}
                            style={{ padding: '7px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingSopItem(false); setNewSopItem({ title: '', description: '', due_date: '' }) }}
                            style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {sopItems.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px' }}>
                        No SOP checklist items yet.
                      </p>
                    ) : sopItems.map((s: any, i: number) => (
                      <div key={s.id} style={{
                        display: 'flex', gap: '12px', padding: '12px 4px',
                        borderBottom: i < sopItems.length - 1 ? '1px solid #EAECEE' : 'none',
                        alignItems: 'flex-start'
                      }}>
                        {editingSopItemId === s.id ? (
                          <div style={{ flex: 1, display: 'grid', gap: '8px' }}>
                            <input
                              value={sopItemDraft.title}
                              onChange={e => setSopItemDraft({ ...sopItemDraft, title: e.target.value })}
                              style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                            <input
                              placeholder="Description"
                              value={sopItemDraft.description || ''}
                              onChange={e => setSopItemDraft({ ...sopItemDraft, description: e.target.value })}
                              style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                            <input
                              type="date"
                              value={sopItemDraft.due_date ? String(sopItemDraft.due_date).slice(0, 10) : ''}
                              onChange={e => setSopItemDraft({ ...sopItemDraft, due_date: e.target.value })}
                              style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => saveSopItem(s.id)} style={{ padding: '6px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                              <button onClick={() => setEditingSopItemId(null)} style={{ padding: '6px 12px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={s.status === 'complete'}
                              onChange={() => toggleSopItem(s)}
                              disabled={!isAdmin}
                              style={{ width: '18px', height: '18px', marginTop: '2px', cursor: isAdmin ? 'pointer' : 'default', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '13px', fontWeight: 600, color: '#323E48',
                                  textDecoration: s.status === 'complete' ? 'line-through' : 'none',
                                  opacity: s.status === 'complete' ? 0.7 : 1
                                }}>
                                  {s.title}
                                </span>
                                <span style={{
                                  fontSize: '9px', fontWeight: 700, padding: '2px 7px',
                                  borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '.3px',
                                  fontFamily: 'Oswald, sans-serif',
                                  background: sopBg(s.status), color: sopColor(s.status)
                                }}>
                                  {sopLabel(s.status)}
                                </span>
                              </div>
                              {s.description && (
                                <p style={{ fontSize: '11px', color: '#697077', marginTop: '4px' }}>{s.description}</p>
                              )}
                              <p style={{ fontSize: '10px', color: '#8a9199', marginTop: '4px' }}>
                                {s.due_date && <>Due {new Date(s.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · </>}
                                {s.checked_by && s.checked_at
                                  ? `Checked by ${s.checked_by} on ${new Date(s.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                  : 'Not yet checked'}
                              </p>
                            </div>
                            {isAdmin && (
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                  onClick={() => { setEditingSopItemId(s.id); setSopItemDraft({ title: s.title, description: s.description, due_date: s.due_date }) }}
                                  style={{ padding: '4px 10px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteSopItem(s.id)}
                                  style={{ padding: '4px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {/* Reference documents */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #EAECEE' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.5px', color: '#A50021', margin: 0 }}>
                          Reference Documents
                        </h3>
                        {isAdmin && !addingSopDoc && (
                          <button
                            onClick={() => setAddingSopDoc(true)}
                            style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                          >
                            + Attach Document
                          </button>
                        )}
                      </div>
                      {addingSopDoc && (
                        <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '12px', display: 'grid', gap: '8px' }}>
                          <input
                            placeholder="Document title (optional — defaults to filename)"
                            value={sopDocTitle}
                            onChange={e => setSopDocTitle(e.target.value)}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            type="file"
                            onChange={e => setSopDocFile(e.target.files?.[0] || null)}
                            style={{ fontSize: '12px' }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={uploadSopDocument}
                              disabled={!sopDocFile || uploadingSopDoc}
                              style={{ padding: '7px 14px', background: (!sopDocFile || uploadingSopDoc) ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: (!sopDocFile || uploadingSopDoc) ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                            >
                              {uploadingSopDoc ? 'Uploading...' : 'Upload'}
                            </button>
                            <button
                              onClick={() => { setAddingSopDoc(false); setSopDocTitle(''); setSopDocFile(null) }}
                              style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {sopDocuments.length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#8a9199', textAlign: 'center', padding: '16px' }}>
                          No SOP reference documents attached yet.
                        </p>
                      ) : sopDocuments.map((d: any) => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #EAECEE' }}>
                          <span style={{ fontSize: '20px', flexShrink: 0 }}>{docIcon(d.file_type)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#323E48' }}>{d.title}</p>
                            <p style={{ fontSize: '10px', color: '#8a9199' }}>
                              Uploaded by {d.uploaded_by} · {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <a
                            href={`/api/documents/download?file=${encodeURIComponent(String(d.file_url).split('/').pop() || '')}`}
                            style={{ padding: '6px 12px', background: '#00538C', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
                          >
                            Download
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => deleteSopDocument(d.id)}
                              style={{ padding: '6px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* CUSTOMER CONTACTS */}
                {activeTab === 'contacts' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      {isAdmin && !addingContact && (
                        <button
                          onClick={() => setAddingContact(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Contact
                        </button>
                      )}
                    </div>
                    {addingContact && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Name*"
                            value={newContact.name}
                            onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            autoFocus
                          />
                          <input
                            placeholder="Role"
                            value={newContact.role}
                            onChange={e => setNewContact({ ...newContact, role: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Email"
                            value={newContact.email}
                            onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            placeholder="Phone"
                            value={newContact.phone}
                            onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#323E48' }}>
                          <input
                            type="checkbox"
                            checked={newContact.is_primary}
                            onChange={e => setNewContact({ ...newContact, is_primary: e.target.checked })}
                          />
                          Primary contact
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={createContact}
                            disabled={!newContact.name.trim()}
                            style={{ padding: '7px 14px', background: !newContact.name.trim() ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: !newContact.name.trim() ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingContact(false); setNewContact({ name: '', role: '', email: '', phone: '', is_primary: false }) }}
                            style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {contacts.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>
                          No contacts found.
                        </p>
                      ) : contacts.map((c: any) => (
                        <div key={c.id} style={{
                          background: '#F4F5F6', border: '1px solid #CCCCCC',
                          borderLeft: c.is_primary ? '4px solid #A50021' : '1px solid #CCCCCC',
                          borderRadius: '8px', padding: '16px'
                        }}>
                          {editingContactId === c.id ? (
                            <div style={{ display: 'grid', gap: '8px' }}>
                              <input value={contactDraft.name} onChange={e => setContactDraft({ ...contactDraft, name: e.target.value })} placeholder="Name" style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                              <input value={contactDraft.role || ''} onChange={e => setContactDraft({ ...contactDraft, role: e.target.value })} placeholder="Role" style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                              <input value={contactDraft.email || ''} onChange={e => setContactDraft({ ...contactDraft, email: e.target.value })} placeholder="Email" style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                              <input value={contactDraft.phone || ''} onChange={e => setContactDraft({ ...contactDraft, phone: e.target.value })} placeholder="Phone" style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#323E48' }}>
                                <input type="checkbox" checked={!!contactDraft.is_primary} onChange={e => setContactDraft({ ...contactDraft, is_primary: e.target.checked })} />
                                Primary contact
                              </label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => saveContact(c.id)} style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                <button onClick={() => setEditingContactId(null)} style={{ padding: '6px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <div style={{
                                  width: '38px', height: '38px', borderRadius: '50%',
                                  background: '#1F3864', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                                  color: '#fff', flexShrink: 0, fontFamily: 'Oswald, sans-serif'
                                }}>
                                  {c.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48' }}>{c.name}</p>
                                  <p style={{ fontSize: '11px', color: '#697077' }}>{c.role}</p>
                                </div>
                                {c.is_primary && (
                                  <span style={{ fontSize: '8px', background: '#A50021', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                                    Primary
                                  </span>
                                )}
                              </div>
                              {c.email && (
                                <a href={`mailto:${c.email}`} style={{ fontSize: '11px', color: '#00538C', display: 'block', marginBottom: '2px' }}>
                                  ✉️ {c.email}
                                </a>
                              )}
                              {c.phone && (
                                <p style={{ fontSize: '11px', color: '#697077' }}>
                                  📞 {c.phone}
                                </p>
                              )}
                              {isAdmin && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                                  <button onClick={() => { setEditingContactId(c.id); setContactDraft({ name: c.name, role: c.role, email: c.email, phone: c.phone, is_primary: c.is_primary }) }} style={{ padding: '4px 10px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => deleteContact(c.id)} style={{ padding: '4px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* SCHEDULE */}
                {activeTab === 'schedule' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      {isAdmin && !addingAppt && (
                        <button
                          onClick={() => setAddingAppt(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Appointment
                        </button>
                      )}
                    </div>
                    {addingAppt && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
                        <input
                          placeholder="Title*"
                          value={newAppt.title}
                          onChange={e => setNewAppt({ ...newAppt, title: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          autoFocus
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            type="datetime-local"
                            value={newAppt.scheduled_at}
                            onChange={e => setNewAppt({ ...newAppt, scheduled_at: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            placeholder="Session type (e.g. Status Call)"
                            value={newAppt.session_type}
                            onChange={e => setNewAppt({ ...newAppt, session_type: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Consultant"
                            value={newAppt.consultant}
                            onChange={e => setNewAppt({ ...newAppt, consultant: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            placeholder="Location (e.g. Zoom, Teams)"
                            value={newAppt.location}
                            onChange={e => setNewAppt({ ...newAppt, location: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <input
                          placeholder="Notes (optional)"
                          value={newAppt.notes}
                          onChange={e => setNewAppt({ ...newAppt, notes: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={createAppointment}
                            disabled={!newAppt.title.trim() || !newAppt.scheduled_at}
                            style={{ padding: '7px 14px', background: (!newAppt.title.trim() || !newAppt.scheduled_at) ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: (!newAppt.title.trim() || !newAppt.scheduled_at) ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingAppt(false); setNewAppt({ title: '', session_type: '', consultant: '', scheduled_at: '', location: '', notes: '' }) }}
                            style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {appointments.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px' }}>
                        No appointments scheduled.
                      </p>
                    ) : appointments.map((a: any, i: number) => (
                      <div key={a.id} style={{
                        padding: '14px 0',
                        borderBottom: i < appointments.length - 1 ? '1px solid #EAECEE' : 'none',
                      }}>
                        {editingApptId === a.id ? (
                          <div style={{ display: 'grid', gap: '8px' }}>
                            <input
                              value={apptDraft.title}
                              onChange={e => setApptDraft({ ...apptDraft, title: e.target.value })}
                              style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input
                                type="datetime-local"
                                value={apptDraft.scheduled_at || ''}
                                onChange={e => setApptDraft({ ...apptDraft, scheduled_at: e.target.value })}
                                style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                              />
                              <input
                                placeholder="Session type"
                                value={apptDraft.session_type || ''}
                                onChange={e => setApptDraft({ ...apptDraft, session_type: e.target.value })}
                                style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input
                                placeholder="Consultant"
                                value={apptDraft.consultant || ''}
                                onChange={e => setApptDraft({ ...apptDraft, consultant: e.target.value })}
                                style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                              />
                              <input
                                placeholder="Location"
                                value={apptDraft.location || ''}
                                onChange={e => setApptDraft({ ...apptDraft, location: e.target.value })}
                                style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                              />
                            </div>
                            <input
                              placeholder="Notes"
                              value={apptDraft.notes || ''}
                              onChange={e => setApptDraft({ ...apptDraft, notes: e.target.value })}
                              style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => saveAppointment(a.id)} style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                              <button onClick={() => setEditingApptId(null)} style={{ padding: '6px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <div style={{ width: '44px', textAlign: 'center', flexShrink: 0 }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#A50021', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                                {a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString('en-US', { month: 'short' }) : '—'}
                              </div>
                              <div style={{ fontSize: '22px', fontWeight: 700, color: '#323E48', fontFamily: 'Oswald, sans-serif', lineHeight: 1.1 }}>
                                {a.scheduled_at ? new Date(a.scheduled_at).getDate() : '—'}
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48', marginBottom: '4px' }}>
                                {a.title}{a.session_type ? ` · ${a.session_type}` : ''}
                              </p>
                              {a.scheduled_at && (
                                <p style={{ fontSize: '11px', color: '#697077', marginBottom: '2px' }}>
                                  🕐 {new Date(a.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                              )}
                              {a.consultant && <p style={{ fontSize: '11px', color: '#697077', marginBottom: '2px' }}>👤 {a.consultant}</p>}
                              {a.location && <p style={{ fontSize: '11px', color: '#697077', marginBottom: '2px' }}>📍 {a.location}</p>}
                              {a.notes && <p style={{ fontSize: '11px', color: '#8a9199', marginTop: '4px' }}>{a.notes}</p>}
                            </div>
                            {isAdmin && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                                <button
                                  onClick={() => { setEditingApptId(a.id); setApptDraft({ title: a.title, session_type: a.session_type, consultant: a.consultant, scheduled_at: toDateTimeLocal(a.scheduled_at), location: a.location, notes: a.notes }) }}
                                  style={{ padding: '6px 14px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteAppointment(a.id)}
                                  style={{ padding: '6px 14px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* STATUS MEETING NOTES */}
                {activeTab === 'meetingNotes' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                      {isAdmin && !addingMeetingNote && (
                        <button
                          onClick={() => setAddingMeetingNote(true)}
                          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#323E48', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}
                        >
                          + Add Status Meeting Note
                        </button>
                      )}
                    </div>
                    {addingMeetingNote && (
                      <div style={{ background: '#F4F5F6', border: '1px solid #CCCCCC', borderRadius: '6px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Title*"
                            value={newMeetingNote.title}
                            onChange={e => setNewMeetingNote({ ...newMeetingNote, title: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                            autoFocus
                          />
                          <input
                            type="date"
                            value={newMeetingNote.meeting_date}
                            onChange={e => setNewMeetingNote({ ...newMeetingNote, meeting_date: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <textarea
                          placeholder="Status update / notes"
                          value={newMeetingNote.body}
                          onChange={e => setNewMeetingNote({ ...newMeetingNote, body: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '60px', fontFamily: 'Roboto, sans-serif' }}
                        />
                        <textarea
                          placeholder="Risks & decisions"
                          value={newMeetingNote.risks_decisions}
                          onChange={e => setNewMeetingNote({ ...newMeetingNote, risks_decisions: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '44px', fontFamily: 'Roboto, sans-serif' }}
                        />
                          <textarea
                          placeholder="Monitor & control notes"
                          value={newMeetingNote.monitor_control}
                          onChange={e => setNewMeetingNote({ ...newMeetingNote, monitor_control: e.target.value })}
                          style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '44px', fontFamily: 'Roboto, sans-serif' }}
                        />
                        <div>
                          <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Notes</label>
                          <NotesEditor value={newMeetingNote.notes} onChange={html => setNewMeetingNote({ ...newMeetingNote, notes: html })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            placeholder="Attendees (comma separated)"
                            value={newMeetingNote.attendees}
                            onChange={e => setNewMeetingNote({ ...newMeetingNote, attendees: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                          <input
                            placeholder="Action items (comma separated)"
                            value={newMeetingNote.action_items}
                            onChange={e => setNewMeetingNote({ ...newMeetingNote, action_items: e.target.value })}
                            style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Customer Satisfaction</label>
                            <select value={newMeetingNote.customer_satisfaction} onChange={e => setNewMeetingNote({ ...newMeetingNote, customer_satisfaction: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                              <option value="na">N/A</option>
                              <option value="green">On Track</option>
                              <option value="yellow">At Risk</option>
                              <option value="red">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Scope</label>
                            <select value={newMeetingNote.scope_status} onChange={e => setNewMeetingNote({ ...newMeetingNote, scope_status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                              <option value="na">N/A</option>
                              <option value="green">On Track</option>
                              <option value="yellow">At Risk</option>
                              <option value="red">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Budget/Quality</label>
                            <select value={newMeetingNote.budget_quality_status} onChange={e => setNewMeetingNote({ ...newMeetingNote, budget_quality_status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                              <option value="na">N/A</option>
                              <option value="green">On Track</option>
                              <option value="yellow">At Risk</option>
                              <option value="red">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>On-Time</label>
                            <select value={newMeetingNote.on_time_status} onChange={e => setNewMeetingNote({ ...newMeetingNote, on_time_status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                              <option value="na">N/A</option>
                              <option value="green">On Track</option>
                              <option value="yellow">At Risk</option>
                              <option value="red">Critical</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={createMeetingNote}
                            disabled={!newMeetingNote.title.trim()}
                            style={{ padding: '7px 14px', background: !newMeetingNote.title.trim() ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: !newMeetingNote.title.trim() ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif' }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingMeetingNote(false); setNewMeetingNote(emptyMeetingNote) }}
                            style={{ padding: '7px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {meetingNotes.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#697077', textAlign: 'center', padding: '40px' }}>
                        No status meeting notes yet.
                      </p>
                    ) : meetingNotes.map((m: any, i: number) => (
                      <div key={m.id} style={{
                        background: '#ffffff', border: '1px solid #CCCCCC', borderRadius: '8px',
                        marginBottom: '12px', overflow: 'hidden'
                      }}>
                        {editingMeetingNoteId === m.id ? (
                          <div style={{ padding: '14px', display: 'grid', gap: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                              <input value={meetingNoteDraft.title} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, title: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                              <input type="date" value={meetingNoteDraft.meeting_date ? String(meetingNoteDraft.meeting_date).slice(0, 10) : ''} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, meeting_date: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                            </div>
                            <textarea placeholder="Status update / notes" value={meetingNoteDraft.body || ''} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, body: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '60px', fontFamily: 'Roboto, sans-serif' }} />
                            <textarea placeholder="Risks & decisions" value={meetingNoteDraft.risks_decisions || ''} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, risks_decisions: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '44px', fontFamily: 'Roboto, sans-serif' }} />
                              <textarea placeholder="Monitor & control notes" value={meetingNoteDraft.monitor_control || ''} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, monitor_control: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '44px', fontFamily: 'Roboto, sans-serif' }} />
                            <div>
                              <label style={{ fontSize: '10px', color: '#8a9199', display: 'block', marginBottom: '4px' }}>Notes</label>
                              <NotesEditor value={meetingNoteDraft.notes} onChange={html => setMeetingNoteDraft({ ...meetingNoteDraft, notes: html })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input placeholder="Attendees (comma separated)" value={meetingNoteDraft.attendees || ''} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, attendees: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                              <input placeholder="Action items (comma separated)" value={meetingNoteDraft.action_items || ''} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, action_items: e.target.value })} style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                              <select value={meetingNoteDraft.customer_satisfaction} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, customer_satisfaction: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                                <option value="na">N/A</option><option value="green">On Track</option><option value="yellow">At Risk</option><option value="red">Critical</option>
                              </select>
                              <select value={meetingNoteDraft.scope_status} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, scope_status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                                <option value="na">N/A</option><option value="green">On Track</option><option value="yellow">At Risk</option><option value="red">Critical</option>
                              </select>
                              <select value={meetingNoteDraft.budget_quality_status} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, budget_quality_status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                                <option value="na">N/A</option><option value="green">On Track</option><option value="yellow">At Risk</option><option value="red">Critical</option>
                              </select>
                              <select value={meetingNoteDraft.on_time_status} onChange={e => setMeetingNoteDraft({ ...meetingNoteDraft, on_time_status: e.target.value })} style={{ width: '100%', fontSize: '12px', padding: '6px 8px', border: '1px solid #CCCCCC', borderRadius: '5px' }}>
                                <option value="na">N/A</option><option value="green">On Track</option><option value="yellow">At Risk</option><option value="red">Critical</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => saveMeetingNote(m.id)} style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                              <button onClick={() => setEditingMeetingNoteId(null)} style={{ padding: '6px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setOpenMeetingNoteId(openMeetingNoteId === m.id ? null : m.id)}
                              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
                            >
                              <div style={{ width: '46px', height: '46px', borderRadius: '8px', background: '#323E48', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                                  {m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '—'}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: 'Oswald, sans-serif' }}>
                                  {m.meeting_date ? new Date(m.meeting_date).getDate() : '—'}
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#323E48', marginBottom: '4px' }}>{m.title}</p>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {[
                                    ['Sat', m.customer_satisfaction], ['Scope', m.scope_status],
                                    ['Bud/Qual', m.budget_quality_status], ['On-Time', m.on_time_status],
                                  ].map(([label, val]: any) => (
                                    <span key={label} style={{
                                      fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px',
                                      textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif',
                                      background: statusBg(val), color: statusColor(val)
                                    }}>
                                      {label}: {statusLabel(val)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span style={{ fontSize: '12px', color: '#8a9199' }}>{openMeetingNoteId === m.id ? '▲' : '▼'}</span>
                            </button>
                            {openMeetingNoteId === m.id && (
                              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #EAECEE' }}>
                                {m.body && (
                                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                    <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Status Update</p>
                                    <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.body}</p>
                                  </div>
                                )}
                                {m.risks_decisions && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Risks & Decisions</p>
                                    <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.risks_decisions}</p>
                                  </div>
                                )}
                                                             {m.monitor_control && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Monitor & Control</p>
                                    <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.monitor_control}</p>
                                  </div>
                                )}
                                {m.notes && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Notes</p>
                                    <NotesEditor value={m.notes} editable={false} />
                                  </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                  {m.attendees && m.attendees.length > 0 && (
                                    <div>
                                      <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Attendees</p>
                                      {m.attendees.map((attendee: string, ai: number) => (
                                        <p key={ai} style={{ fontSize: '11px', color: '#323E48', marginBottom: '4px' }}>👤 {attendee}</p>
                                      ))}
                                    </div>
                                  )}
                                  {m.action_items && m.action_items.length > 0 && (
                                    <div>
                                      <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Action Items</p>
                                      {m.action_items.map((item: string, ai: number) => (
                                        <p key={ai} style={{ fontSize: '11px', color: '#323E48', marginBottom: '4px' }}>☐ {item}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p style={{ fontSize: '10px', color: '#8a9199', marginTop: '12px' }}>By {m.author}</p>
                                {isAdmin && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #EAECEE' }}>
                                    <button
                                      onClick={() => { setEditingMeetingNoteId(m.id); setMeetingNoteDraft({ ...m, attendees: joinList(m.attendees), action_items: joinList(m.action_items) }) }}
                                      style={{ padding: '6px 14px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteMeetingNote(m.id)}
                                      style={{ padding: '6px 14px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
