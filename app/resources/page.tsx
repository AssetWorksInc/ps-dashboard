'use client'
import { useEffect, useState } from 'react'

const C = {
  red: '#A50021', dark: '#323E48', gray: '#697077', lightGray: '#8a9199',
  blue: '#00538C', green: '#2E7D32', amber: '#8a6400',
  greenBg: '#E7F3E8', amberBg: '#FDF3DC', redBg: '#FBE7EA',
  border: '#CCCCCC', rowBorder: '#EAECEE', zebra: '#F4F5F6', navy: '#1F3864',
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px',
  padding: '20px 22px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '20px',
}
const headingStyle: React.CSSProperties = {
  fontFamily: 'Oswald, sans-serif', fontSize: '14px', textTransform: 'uppercase',
  letterSpacing: '.5px', color: C.red, margin: 0,
}
const inputStyle: React.CSSProperties = {
  fontSize: '13px', padding: '6px 8px', border: `1px solid ${C.border}`,
  borderRadius: '5px', fontFamily: 'Roboto, sans-serif', width: '100%', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: C.lightGray, marginBottom: '3px', display: 'block',
  textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif',
}
const primaryBtn: React.CSSProperties = {
  padding: '6px 14px', background: C.red, color: '#fff', border: 'none', borderRadius: '5px',
  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif',
}
const secondaryBtn: React.CSSProperties = {
  padding: '6px 14px', background: '#fff', color: C.dark, border: `1px solid ${C.border}`,
  borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: C.lightGray, padding: '2px 6px',
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: '11.5px', fontWeight: 600, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
    letterSpacing: '.3px', padding: '6px 14px', borderRadius: '999px',
    border: `1px solid ${active ? C.red : C.border}`,
    color: active ? '#fff' : C.gray, background: active ? C.red : '#fff', cursor: 'pointer',
  }
}

const emptySession = { title: '', description: '', type: 'recorded', video_url: '', duration_min: '', presenter: '', is_published: true }
const emptyMaterial = { title: '', description: '', type: 'guide', file_url: '', category: '', author: '' }

export default function ResourcesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sessions' | 'materials'>('sessions')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const [addingSession, setAddingSession] = useState(false)
  const [newSession, setNewSession] = useState<any>(emptySession)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [sessionDraft, setSessionDraft] = useState<any>(emptySession)

  const [addingMaterial, setAddingMaterial] = useState(false)
  const [newMaterial, setNewMaterial] = useState<any>(emptyMaterial)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [materialDraft, setMaterialDraft] = useState<any>(emptyMaterial)

  function refresh() {
    fetch('/api/resources').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  if (loading || !data) {
    return <div style={{ padding: '30px', fontFamily: 'Roboto, sans-serif', color: C.gray }}>Loading...</div>
  }

  const isAdmin = !!data.isAdmin
  const sessions: any[] = data.sessions || []
  const materials: any[] = data.materials || []

  const categories = Array.from(new Set(materials.map((m: any) => m.category).filter(Boolean))) as string[]

  const filteredSessions = sessions.filter((s: any) =>
    !search ||
    (s.title && s.title.toLowerCase().includes(search.toLowerCase())) ||
    (s.presenter && s.presenter.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredMaterials = materials.filter((m: any) => {
    const matchesSearch = !search ||
      (m.title && m.title.toLowerCase().includes(search.toLowerCase())) ||
      (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory
    return matchesSearch && matchesCategory
  })

  async function createSession() {
    if (!newSession.title.trim()) return
    const res = await fetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSession),
    })
    if (res.ok) {
      setNewSession(emptySession)
      setAddingSession(false)
      refresh()
    }
  }

  function startEditSession(s: any) {
    setEditingSessionId(s.id)
    setSessionDraft({
      title: s.title || '',
      description: s.description || '',
      type: s.type || 'recorded',
      video_url: s.video_url || '',
      duration_min: s.duration_min != null ? String(s.duration_min) : '',
      presenter: s.presenter || '',
      is_published: s.is_published !== false,
    })
  }

  async function saveSession(id: string) {
    const res = await fetch(`/api/training-sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionDraft),
    })
    if (res.ok) {
      setEditingSessionId(null)
      refresh()
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('Delete this session?')) return
    const res = await fetch(`/api/training-sessions/${id}`, { method: 'DELETE' })
    if (res.ok) refresh()
  }

  async function createMaterial() {
    if (!newMaterial.title.trim()) return
    const res = await fetch('/api/training-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial),
    })
    if (res.ok) {
      setNewMaterial(emptyMaterial)
      setAddingMaterial(false)
      refresh()
    }
  }

  function startEditMaterial(m: any) {
    setEditingMaterialId(m.id)
    setMaterialDraft({
      title: m.title || '',
      description: m.description || '',
      type: m.type || 'guide',
      file_url: m.file_url || '',
      category: m.category || '',
      author: m.author || '',
    })
  }

  async function saveMaterial(id: string) {
    const res = await fetch(`/api/training-materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materialDraft),
    })
    if (res.ok) {
      setEditingMaterialId(null)
      refresh()
    }
  }

  async function deleteMaterial(id: string) {
    if (!confirm('Delete this material?')) return
    const res = await fetch(`/api/training-materials/${id}`, { method: 'DELETE' })
    if (res.ok) refresh()
  }

  return (
    <div style={{ padding: '26px 34px', fontFamily: 'Roboto, sans-serif', maxWidth: '1180px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '22px', fontWeight: 600, color: C.dark, margin: 0, textTransform: 'uppercase', letterSpacing: '.3px' }}>
            Resource Center
          </h1>
          <div style={{ fontSize: '12.5px', color: C.lightGray, marginTop: '4px' }}>
            Recorded sessions, guides, SOPs, checklists, and best practices — everything your team needs in one place.
          </div>
        </div>
        {isAdmin && (
          <button
            style={primaryBtn}
            onClick={() => tab === 'sessions' ? setAddingSession(true) : setAddingMaterial(true)}
          >
            + Add {tab === 'sessions' ? 'Session' : 'Material'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', fontWeight: 600, color: C.red }}>{sessions.length}</div>
          <div style={labelStyle}>Recorded Sessions</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', fontWeight: 600, color: C.red }}>{materials.length}</div>
          <div style={labelStyle}>Training Materials</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', fontWeight: 600, color: C.red }}>{categories.length}</div>
          <div style={labelStyle}>Categories</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', fontWeight: 600, color: C.red }}>{sessions.length + materials.length}</div>
          <div style={labelStyle}>Total Resources</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${C.rowBorder}`, marginBottom: '20px' }}>
        {[{ id: 'sessions', label: 'Recorded Sessions' }, { id: 'materials', label: 'Training Materials' }].map(t => (
          <div
            key={t.id}
            onClick={() => { setTab(t.id as 'sessions' | 'materials'); setSearch(''); setActiveCategory('All') }}
            style={{
              padding: '10px 18px', fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.4px', cursor: 'pointer',
              color: tab === t.id ? C.red : C.lightGray,
              borderBottom: tab === t.id ? `3px solid ${C.red}` : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'materials' && categories.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={chipStyle(activeCategory === 'All')} onClick={() => setActiveCategory('All')}>
            All ({materials.length})
          </div>
          {categories.map(cat => (
            <div key={cat} style={chipStyle(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
              {cat} ({materials.filter((m: any) => m.category === cat).length})
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
        <input
          style={{ ...inputStyle, maxWidth: '320px' }}
          placeholder={tab === 'sessions' ? 'Search sessions...' : 'Search materials...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ fontSize: '12px', color: C.lightGray, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '.3px' }}>
          {tab === 'sessions' ? `${filteredSessions.length} sessions` : `${filteredMaterials.length} materials`}
        </div>
      </div>

      {tab === 'sessions' && addingSession && (
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Presenter</label>
              <input style={inputStyle} value={newSession.presenter} onChange={e => setNewSession({ ...newSession, presenter: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input style={inputStyle} value={newSession.duration_min} onChange={e => setNewSession({ ...newSession, duration_min: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <input style={inputStyle} value={newSession.type} onChange={e => setNewSession({ ...newSession, type: e.target.value })} placeholder="recorded, webinar, training" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Video URL</label>
              <input style={inputStyle} value={newSession.video_url} onChange={e => setNewSession({ ...newSession, video_url: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '60px' }} value={newSession.description} onChange={e => setNewSession({ ...newSession, description: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={primaryBtn} onClick={createSession}>Save</button>
            <button style={secondaryBtn} onClick={() => { setAddingSession(false); setNewSession(emptySession) }}>Cancel</button>
          </div>
        </div>
      )}

      {tab === 'materials' && addingMaterial && (
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={newMaterial.title} onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} value={newMaterial.category} onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })} placeholder="e.g. SOPs, ETL Guides" list="category-options" />
              <datalist id="category-options">
                {categories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <input style={inputStyle} value={newMaterial.type} onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })} placeholder="guide, checklist, sop" />
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input style={inputStyle} value={newMaterial.author} onChange={e => setNewMaterial({ ...newMaterial, author: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>File URL</label>
              <input style={inputStyle} value={newMaterial.file_url} onChange={e => setNewMaterial({ ...newMaterial, file_url: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '60px' }} value={newMaterial.description} onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={primaryBtn} onClick={createMaterial}>Save</button>
            <button style={secondaryBtn} onClick={() => { setAddingMaterial(false); setNewMaterial(emptyMaterial) }}>Cancel</button>
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filteredSessions.map((s: any) => (
            <div key={s.id} style={{ background: '#fff', border: `1px solid ${C.rowBorder}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(50,62,72,.05)' }}>
              {editingSessionId === s.id ? (
                <div>
                  <input style={{ ...inputStyle, marginBottom: '8px', fontWeight: 700 }} value={sessionDraft.title} onChange={e => setSessionDraft({ ...sessionDraft, title: e.target.value })} />
                  <textarea style={{ ...inputStyle, minHeight: '50px', marginBottom: '8px' }} value={sessionDraft.description} onChange={e => setSessionDraft({ ...sessionDraft, description: e.target.value })} />
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={sessionDraft.presenter} onChange={e => setSessionDraft({ ...sessionDraft, presenter: e.target.value })} placeholder="Presenter" />
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={sessionDraft.duration_min} onChange={e => setSessionDraft({ ...sessionDraft, duration_min: e.target.value })} placeholder="Duration (min)" />
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={sessionDraft.video_url} onChange={e => setSessionDraft({ ...sessionDraft, video_url: e.target.value })} placeholder="Video URL" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={primaryBtn} onClick={() => saveSession(s.id)}>Save</button>
                    <button style={secondaryBtn} onClick={() => setEditingSessionId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ height: '84px', borderRadius: '6px', marginBottom: '12px', background: 'linear-gradient(135deg,#1F3864,#00538C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>▶️</div>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.3px', fontFamily: 'Oswald, sans-serif', background: '#E9F0FA', color: C.blue, display: 'inline-block', marginBottom: '8px' }}>
                    {s.type}
                  </span>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 6px 0', color: C.dark }}>{s.title}</h3>
                  {s.description && <div style={{ fontSize: '12px', color: C.gray, lineHeight: 1.5, marginBottom: '12px' }}>{s.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.lightGray, marginBottom: '12px' }}>
                    {s.presenter && <span>{s.presenter}</span>}
                    {s.presenter && s.duration_min && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ccc' }} />}
                    {s.duration_min && <span>{s.duration_min} min</span>}
                    {!s.is_published && <span style={{ color: C.amber, fontWeight: 600 }}>DRAFT</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {s.video_url ? (
                      <a href={s.video_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', fontWeight: 600, color: C.red, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '.3px', textDecoration: 'none' }}>▶ Watch</a>
                    ) : <span />}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={iconBtn} onClick={() => startEditSession(s)}>✎</button>
                        <button style={iconBtn} onClick={() => deleteSession(s.id)}>🗑</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: C.lightGray, fontSize: '13px' }}>No sessions found.</div>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filteredMaterials.map((m: any) => (
            <div key={m.id} style={{ background: '#fff', border: `1px solid ${C.rowBorder}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(50,62,72,.05)' }}>
              {editingMaterialId === m.id ? (
                <div>
                  <input style={{ ...inputStyle, marginBottom: '8px', fontWeight: 700 }} value={materialDraft.title} onChange={e => setMaterialDraft({ ...materialDraft, title: e.target.value })} />
                  <textarea style={{ ...inputStyle, minHeight: '50px', marginBottom: '8px' }} value={materialDraft.description} onChange={e => setMaterialDraft({ ...materialDraft, description: e.target.value })} />
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={materialDraft.category} onChange={e => setMaterialDraft({ ...materialDraft, category: e.target.value })} placeholder="Category" />
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={materialDraft.author} onChange={e => setMaterialDraft({ ...materialDraft, author: e.target.value })} placeholder="Author" />
                  <input style={{ ...inputStyle, marginBottom: '8px' }} value={materialDraft.file_url} onChange={e => setMaterialDraft({ ...materialDraft, file_url: e.target.value })} placeholder="File URL" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={primaryBtn} onClick={() => saveMaterial(m.id)}>Save</button>
                    <button style={secondaryBtn} onClick={() => setEditingMaterialId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ height: '84px', borderRadius: '6px', marginBottom: '12px', background: C.zebra, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>📄</div>
                  {m.category && (
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: C.blue, fontFamily: 'Oswald, sans-serif', marginBottom: '8px', display: 'block' }}>
                      {m.category}
                    </span>
                  )}
                  <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 6px 0', color: C.dark }}>{m.title}</h3>
                  {m.description && <div style={{ fontSize: '12px', color: C.gray, lineHeight: 1.5, marginBottom: '12px' }}>{m.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.lightGray, marginBottom: '12px' }}>
                    {m.type && <span>{m.type}</span>}
                    {m.author && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ccc' }} />}
                    {m.author && <span>{m.author}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {m.file_url ? (
                      <a href={m.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', fontWeight: 600, color: C.red, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '.3px', textDecoration: 'none' }}>Open →</a>
                    ) : <span />}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={iconBtn} onClick={() => startEditMaterial(m)}>✎</button>
                        <button style={iconBtn} onClick={() => deleteMaterial(m.id)}>🗑</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredMaterials.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: C.lightGray, fontSize: '13px' }}>No materials found.</div>
          )}
        </div>
      )}
    </div>
  )
}
