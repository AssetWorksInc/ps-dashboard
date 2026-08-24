import { useEffect, useState } from 'react'
import UploadButton from '@/components/UploadButton'

export default function CollaborationHub() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('announcements')
  const [openDiscussion, setOpenDiscussion] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Announcements state
  const [addingAnnouncement, setAddingAnnouncement] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '', is_pinned: false })
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [announcementDraft, setAnnouncementDraft] = useState<any>({})

  // Discussions state
  const [newDiscussion, setNewDiscussion] = useState({ title: '', body: '' })
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    refresh()
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => setDocuments(d.documents || []))
      .catch(() => {})
  }, [])

  async function refresh() {
    try {
      const res = await fetch('/api/collaboration')
      const d = await res.json()
      setData(d)
    } catch {
      // keep previous data on failure
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading collaboration hub...</p>
    </div>
  )

  const isAdmin = !!data?.isAdmin

  const handleDelete = async (doc: any) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, fileUrl: doc.file_url })
      })
      const result = await res.json()
      if (result.success) {
        setDocuments(prev => prev.filter(d => d.id !== doc.id))
      } else {
        alert('Delete failed. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setDeletingId(null)
  }

  // Announcements CRUD
  async function createAnnouncement() {
    if (!newAnnouncement.title.trim()) return
    const res = await fetch('/api/project-announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnnouncement),
    })
    const result = await res.json()
    if (result.success) {
      await refresh()
      setAddingAnnouncement(false)
      setNewAnnouncement({ title: '', body: '', is_pinned: false })
    }
  }
  async function saveAnnouncement(id: string) {
    const res = await fetch(`/api/project-announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: announcementDraft.title, body: announcementDraft.body, is_pinned: !!announcementDraft.is_pinned }),
    })
    const result = await res.json()
    if (result.success) {
      await refresh()
      setEditingAnnouncementId(null)
    }
  }
  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    const res = await fetch(`/api/project-announcements/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await refresh()
  }

  // Discussions CRUD
  async function createDiscussion() {
    if (!newDiscussion.title.trim()) return
    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDiscussion),
    })
    const result = await res.json()
    if (result.success) {
      await refresh()
      setNewDiscussion({ title: '', body: '' })
    }
  }
  async function deleteDiscussion(id: string) {
    if (!confirm('Delete this discussion and all its replies?')) return
    const res = await fetch(`/api/discussions/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await refresh()
  }
  async function togglePinDiscussion(d: any) {
    await fetch(`/api/discussions/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !d.is_pinned }),
    })
    await refresh()
  }
  async function postReply(discussionId: string) {
    if (!replyText.trim()) return
    const res = await fetch('/api/discussion-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discussion_id: discussionId, body: replyText }),
    })
    const result = await res.json()
    if (result.success) {
      setReplyText('')
      await refresh()
    }
  }
  async function deleteReply(id: string) {
    if (!confirm('Delete this reply?')) return
    const res = await fetch(`/api/discussion-replies/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) await refresh()
  }

  const tabs = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'documents', label: 'Shared Documents' },
    { id: 'team', label: 'Team Directory' },
    { id: 'discussions', label: 'Discussions' },
  ]

  const initials = (name: string) =>
    (name || '').split(' ').map((n: string) => n[0]).join('').toUpperCase()
  const avatarColor = (name: string) => {
    const colors = ['#1F3864', '#A50021', '#2E7D32', '#8a6400', '#323E48']
    return colors[(name || '').charCodeAt(0) % colors.length]
  }
  const fileIcon = (type: string) => {
    if (type === 'pdf') return '📕'
    if (type?.match(/xlsx?/)) return '📗'
    if (type?.match(/docx?/)) return '📘'
    if (type?.match(/pptx?/)) return '📙'
    return '📄'
  }

  const discussionReplies = (discussionId: string) =>
    (data?.discussionReplies || []).filter((r: any) => r.discussion_id === discussionId)

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Top bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '4px solid #A50021',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: '16px', color: '#323E48' }}>
            Collaboration Hub
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Announcements · Shared documents · Team directory · Discussions
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 28px 60px' }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Announcements', value: data?.announcements?.length || 0, tab: 'announcements' },
            { label: 'Documents', value: documents.length, tab: 'documents' },
            { label: 'Team Members', value: data?.team?.length || 0, tab: 'team' },
            { label: 'Discussions', value: data?.discussions?.length || 0, tab: 'discussions' },
          ].map((k, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(k.tab)}
              style={{
                background: activeTab === k.tab ? '#A50021' : '#ffffff',
                border: activeTab === k.tab ? '2px solid #A50021' : '1px solid #CCCCCC',
                borderTop: '4px solid #A50021',
                borderRadius: '8px', padding: '14px 12px',
                boxShadow: activeTab === k.tab ? '0 2px 8px rgba(165,0,33,0.15)' : '0 1px 3px rgba(50,62,72,.08)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
              }}
            >
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px', color: activeTab === k.tab ? 'rgba(255,255,255,0.7)' : '#8a9199', marginBottom: '4px' }}>
                {k.label}
              </div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', fontWeight: 700, color: activeTab === k.tab ? '#ffffff' : '#323E48' }}>
                {k.value}
              </div>
            </button>
          ))}
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #CCCCCC', marginBottom: '20px', background: '#ffffff', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '11px 8px',
                fontFamily: 'Oswald, sans-serif', fontSize: '11px',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px',
                color: activeTab === t.id ? '#A50021' : '#697077',
                background: activeTab === t.id ? '#ffffff' : '#F4F5F6',
                border: 'none',
                borderBottom: activeTab === t.id ? '3px solid #A50021' : '3px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* ── ANNOUNCEMENTS ── */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isAdmin && addingAnnouncement && (
              <div style={{ background: '#ffffff', border: '2px solid #A50021', borderRadius: '8px', padding: '16px 20px', display: 'grid', gap: '8px' }}>
                <input
                  placeholder="Title*"
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  style={{ fontSize: '12px', padding: '8px 10px', border: '1px solid #CCCCCC', borderRadius: '5px' }}
                  autoFocus
                />
                <textarea
                  placeholder="Announcement body"
                  value={newAnnouncement.body}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
                  style={{ fontSize: '12px', padding: '8px 10px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '70px', fontFamily: 'Roboto, sans-serif' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#323E48' }}>
                  <input type="checkbox" checked={newAnnouncement.is_pinned} onChange={e => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })} />
                  Pin this announcement
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={createAnnouncement}
                    disabled={!newAnnouncement.title.trim()}
                    style={{ padding: '7px 16px', background: !newAnnouncement.title.trim() ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: !newAnnouncement.title.trim() ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}
                  >
                    Post
                  </button>
                  <button
                    onClick={() => { setAddingAnnouncement(false); setNewAnnouncement({ title: '', body: '', is_pinned: false }) }}
                    style={{ padding: '7px 16px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {data?.announcements?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '8px', border: '2px solid #A50021' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📢</div>
                <p style={{ fontSize: '13px', color: '#697077' }}>No announcements yet.</p>
              </div>
            ) : data?.announcements?.map((a: any) => (
              <div key={a.id} style={{
                background: '#ffffff', border: '2px solid #A50021',
                borderLeft: '5px solid #A50021', borderRadius: '8px',
                padding: '18px 20px', boxShadow: '0 2px 8px rgba(165,0,33,0.10)'
              }}>
                {editingAnnouncementId === a.id ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <input value={announcementDraft.title} onChange={e => setAnnouncementDraft({ ...announcementDraft, title: e.target.value })} style={{ fontSize: '12px', padding: '8px 10px', border: '1px solid #CCCCCC', borderRadius: '5px' }} />
                    <textarea value={announcementDraft.body || ''} onChange={e => setAnnouncementDraft({ ...announcementDraft, body: e.target.value })} style={{ fontSize: '12px', padding: '8px 10px', border: '1px solid #CCCCCC', borderRadius: '5px', resize: 'vertical', minHeight: '70px', fontFamily: 'Roboto, sans-serif' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#323E48' }}>
                      <input type="checkbox" checked={!!announcementDraft.is_pinned} onChange={e => setAnnouncementDraft({ ...announcementDraft, is_pinned: e.target.checked })} />
                      Pinned
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => saveAnnouncement(a.id)} style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingAnnouncementId(null)} style={{ padding: '6px 14px', background: '#fff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {a.is_pinned && (
                          <span style={{ fontSize: '9px', background: '#A50021', color: '#fff', padding: '2px 7px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                            Pinned
                          </span>
                        )}
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', fontWeight: 700, color: '#323E48' }}>
                          {a.title}
                        </h3>
                      </div>
                      <span style={{ fontSize: '10px', color: '#8a9199', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, marginBottom: '10px' }}>{a.body}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: avatarColor(a.author), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: 'Oswald, sans-serif' }}>
                          {initials(a.author)}
                        </div>
                        <span style={{ fontSize: '11px', color: '#697077' }}>Posted by {a.author}</span>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => { setEditingAnnouncementId(a.id); setAnnouncementDraft({ title: a.title, body: a.body, is_pinned: a.is_pinned }) }} style={{ padding: '4px 10px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteAnnouncement(a.id)} style={{ padding: '4px 10px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {isAdmin && !addingAnnouncement && (
              <button
                onClick={() => setAddingAnnouncement(true)}
                style={{ padding: '14px', background: 'transparent', border: '2px dashed #A50021', borderRadius: '8px', fontSize: '12px', color: '#A50021', cursor: 'pointer', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px' }}
              >
                + Post New Announcement
              </button>
            )}
          </div>
        )}
        {/* ── SHARED DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ background: '#ffffff', border: '2px solid #A50021', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(165,0,33,0.10)', marginBottom: '12px' }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', background: '#A50021', borderBottom: '1px solid #8E1537', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Shared Documents — {documents.length} files
                </p>
                <UploadButton
                  uploadedBy="Portal User"
                  onUploadComplete={(doc) => setDocuments((prev: any[]) => [doc, ...prev])}
                />
              </div>
              {/* Document list */}
              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '14px' }}>📁</div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#323E48', marginBottom: '6px', fontFamily: 'Oswald, sans-serif' }}>
                    No documents yet
                  </p>
                  <p style={{ fontSize: '12px', color: '#697077' }}>
                    Upload your first document using the button above
                  </p>
                </div>
              ) : documents.map((d: any, i: number) => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 18px',
                  borderBottom: i < documents.length - 1 ? '1px solid #EAECEE' : 'none',
                  background: i % 2 === 0 ? '#ffffff' : '#F4F5F6'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#FBE7EA', color: '#A50021', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {fileIcon(d.file_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#323E48', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.title}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', background: '#FBE7EA', color: '#A50021', padding: '2px 6px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                        {d.file_type?.toUpperCase() || 'FILE'}
                      </span>
                      {d.category && <span style={{ fontSize: '10px', color: '#8a9199' }}>{d.category}</span>}
                      <span style={{ fontSize: '10px', color: '#8a9199' }}>
                        By {d.uploaded_by} · {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => window.open(`/api/documents/download?file=${d.file_url?.split('/').pop()}`, '_blank')}
                      style={{ padding: '6px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleDelete(d)}
                      disabled={deletingId === d.id}
                      style={{
                        padding: '6px 14px',
                        background: deletingId === d.id ? '#C9CFD4' : '#ffffff',
                        color: deletingId === d.id ? '#ffffff' : '#A50021',
                        border: '2px solid #A50021',
                        borderRadius: '5px', fontSize: '11px',
                        fontWeight: 700, cursor: deletingId === d.id ? 'default' : 'pointer',
                        fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                      }}
                    >
                      {deletingId === d.id ? 'Deleting...' : '🗑 Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ── TEAM DIRECTORY ── */}
        {activeTab === 'team' && (
          <div>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Your PS Team
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {data?.team?.filter((m: any) => m.is_ps_team).map((member: any) => (
                <div key={member.id} style={{ background: '#ffffff', border: '2px solid #A50021', borderLeft: '5px solid #A50021', borderRadius: '8px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(165,0,33,0.10)', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1F3864', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                    {initials(member.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, color: '#323E48', marginBottom: '2px' }}>{member.name}</h3>
                    <p style={{ fontSize: '11px', color: '#A50021', fontWeight: 600, marginBottom: '6px' }}>{member.role}</p>
                    {member.email && (
                      <a href={`mailto:${member.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#00538C', textDecoration: 'none', marginBottom: '8px' }}>
                        ✉️ {member.email}
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ padding: '5px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Message</button>
                      <button style={{ padding: '5px 12px', background: '#ffffff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>📅 Schedule</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {data?.team?.filter((m: any) => !m.is_ps_team).length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Institution Team
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {data?.team?.filter((m: any) => !m.is_ps_team).map((member: any) => (
                    <div key={member.id} style={{ background: '#ffffff', border: '2px solid #A50021', borderRadius: '8px', padding: '16px 18px', boxShadow: '0 2px 8px rgba(165,0,33,0.10)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: avatarColor(member.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#323E48' }}>{member.name}</p>
                        <p style={{ fontSize: '10px', color: '#697077' }}>{member.role}</p>
                        {member.email && (
                          <a href={`mailto:${member.email}`} style={{ fontSize: '10px', color: '#00538C', textDecoration: 'none' }}>{member.email}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* ── DISCUSSIONS ── */}
        {activeTab === 'discussions' && (
          <div>
            <div style={{ background: '#ffffff', border: '2px solid #A50021', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(165,0,33,0.10)', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, color: '#A50021', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>
                Start a New Discussion
              </p>
              <input
                value={newDiscussion.title}
                onChange={e => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                placeholder="Discussion title*"
                style={{ width: '100%', padding: '8px 12px', fontSize: '12px', border: '1px solid #A50021', borderRadius: '6px', color: '#323E48', outline: 'none', fontFamily: 'Roboto, sans-serif', marginBottom: '8px' }}
              />
              <textarea
                value={newDiscussion.body}
                onChange={e => setNewDiscussion({ ...newDiscussion, body: e.target.value })}
                placeholder="What would you like to discuss with your PS team?"
                style={{ width: '100%', padding: '10px 14px', fontSize: '12px', border: '1px solid #A50021', borderRadius: '6px', resize: 'none', height: '70px', color: '#323E48', outline: 'none', fontFamily: 'Roboto, sans-serif' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={createDiscussion}
                  disabled={!newDiscussion.title.trim()}
                  style={{ padding: '7px 18px', background: !newDiscussion.title.trim() ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: !newDiscussion.title.trim() ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}
                >
                  Post Discussion
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.discussions?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '8px', border: '2px solid #A50021' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  <p style={{ fontSize: '13px', color: '#697077' }}>No discussions yet. Start one above.</p>
                </div>
              ) : data?.discussions?.map((d: any) => (
                <div key={d.id} style={{ background: '#ffffff', border: '2px solid #A50021', borderLeft: d.is_pinned ? '5px solid #A50021' : '2px solid #A50021', borderRadius: '8px', boxShadow: '0 2px 8px rgba(165,0,33,0.10)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenDiscussion(openDiscussion === d.id ? null : d.id)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: avatarColor(d.author), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                      {initials(d.author)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {d.is_pinned && (
                          <span style={{ fontSize: '9px', background: '#A50021', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Pinned</span>
                        )}
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, color: '#323E48' }}>{d.title}</h3>
                      </div>
                      <p style={{ fontSize: '11px', color: '#697077', lineHeight: 1.5, marginBottom: '6px' }}>
                        {d.body?.substring(0, 120)}{d.body?.length > 120 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#697077' }}>By {d.author}</span>
                        <span style={{ fontSize: '10px', color: '#8a9199' }}>{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span style={{ fontSize: '10px', color: '#A50021', fontWeight: 600 }}>💬 {d.reply_count || 0} replies</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8a9199', flexShrink: 0 }}>{openDiscussion === d.id ? '▲' : '▼'}</span>
                  </button>
                  {openDiscussion === d.id && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid #FBE7EA' }}>
                      <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, margin: '14px 0' }}>{d.body}</p>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <button onClick={() => togglePinDiscussion(d)} style={{ padding: '5px 12px', background: '#fff', color: '#00538C', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                            {d.is_pinned ? '📌 Unpin' : '📌 Pin'}
                          </button>
                          <button onClick={() => deleteDiscussion(d.id)} style={{ padding: '5px 12px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                            🗑 Delete Discussion
                          </button>
                        </div>
                      )}
                      {discussionReplies(d.id).length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          {discussionReplies(d.id).map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #EAECEE' }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: avatarColor(r.author), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'Oswald, sans-serif' }}>
                                {initials(r.author)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#323E48' }}>{r.author}</span>
                                  <span style={{ fontSize: '9px', color: '#8a9199' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#697077', lineHeight: 1.6, marginTop: '2px' }}>{r.body}</p>
                              </div>
                              {isAdmin && (
                                <button onClick={() => deleteReply(r.id)} style={{ padding: '2px 8px', background: '#fff', color: '#A50021', border: '1px solid #CCCCCC', borderRadius: '4px', fontSize: '9px', cursor: 'pointer', flexShrink: 0 }}>Delete</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ background: '#FBE7EA', borderRadius: '6px', padding: '10px 14px' }}>
                        <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', color: '#A50021', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>Reply</p>
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          style={{ width: '100%', padding: '8px 12px', fontSize: '11px', border: '1px solid #A50021', borderRadius: '5px', resize: 'none', height: '60px', color: '#323E48', outline: 'none', fontFamily: 'Roboto, sans-serif', background: '#fff' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            onClick={() => postReply(d.id)}
                            disabled={!replyText.trim()}
                            style={{ padding: '5px 14px', background: !replyText.trim() ? '#C9CFD4' : '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: !replyText.trim() ? 'default' : 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
