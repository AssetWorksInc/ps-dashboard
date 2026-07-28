'use client'

import { useEffect, useState } from 'react'

export default function CollaborationHub() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('announcements')
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [openDiscussion, setOpenDiscussion] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetch('/api/collaboration')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading collaboration hub...</p>
    </div>
  )

  const tabs = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'meetings', label: 'Meeting Notes' },
    { id: 'documents', label: 'Shared Documents' },
    { id: 'team', label: 'Team Directory' },
    { id: 'discussions', label: 'Discussions' },
  ]

  const initials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase()

  const avatarColor = (name: string) => {
    const colors = ['#1F3864', '#A50021', '#2E7D32', '#8a6400', '#323E48']
    return colors[name.charCodeAt(0) % colors.length]
  }

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
            Meeting notes · Shared documents · Team directory · Discussions · Announcements
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 28px 60px' }}>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Announcements', value: data?.announcements?.length || 0, color: '#A50021', tab: 'announcements' },
            { label: 'Meeting Notes', value: data?.meetingNotes?.length || 0, color: '#1F3864', tab: 'meetings' },
            { label: 'Documents', value: data?.documents?.length || 0, color: '#2E7D32', tab: 'documents' },
            { label: 'Team Members', value: data?.team?.length || 0, color: '#323E48', tab: 'team' },
            { label: 'Discussions', value: data?.discussions?.length || 0, color: '#8a6400', tab: 'discussions' },
          ].map((k, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(k.tab)}
              style={{
                background: activeTab === k.tab ? '#323E48' : '#ffffff',
                border: '1px solid #CCCCCC',
                borderTop: `4px solid ${k.color}`,
                borderRadius: '8px', padding: '14px 12px',
                boxShadow: '0 1px 3px rgba(50,62,72,.08)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px', color: activeTab === k.tab ? '#8a9199' : '#8a9199', marginBottom: '4px' }}>
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
                cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ANNOUNCEMENTS ── */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.announcements?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '8px', border: '1px solid #CCCCCC' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📢</div>
                <p style={{ fontSize: '13px', color: '#697077' }}>No announcements yet.</p>
              </div>
            ) : data?.announcements?.map((a: any) => (
              <div key={a.id} style={{
                background: '#ffffff', border: '1px solid #CCCCCC',
                borderLeft: `4px solid ${a.is_pinned ? '#A50021' : '#CCCCCC'}`,
                borderRadius: '8px', padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(50,62,72,.08)'
              }}>
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
                <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, marginBottom: '10px' }}>
                  {a.body}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: avatarColor(a.author),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, color: '#fff',
                    fontFamily: 'Oswald, sans-serif'
                  }}>
                    {initials(a.author)}
                  </div>
                  <span style={{ fontSize: '11px', color: '#697077' }}>Posted by {a.author}</span>
                </div>
              </div>
            ))}
            <button style={{
              padding: '14px', background: 'transparent',
              border: '2px dashed #CCCCCC', borderRadius: '8px',
              fontSize: '12px', color: '#697077', cursor: 'pointer',
              fontFamily: 'Oswald, sans-serif', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.3px'
            }}>
              + Post New Announcement
            </button>
          </div>
        )}

        {/* ── MEETING NOTES ── */}
        {activeTab === 'meetings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.meetingNotes?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '8px', border: '1px solid #CCCCCC' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                <p style={{ fontSize: '13px', color: '#697077' }}>No meeting notes yet.</p>
              </div>
            ) : data?.meetingNotes?.map((m: any) => (
              <div key={m.id} style={{
                background: '#ffffff', border: '1px solid #CCCCCC',
                borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setOpenNote(openNote === m.id ? null : m.id)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '14px'
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '8px',
                    background: '#1F3864', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <div style={{ fontSize: '9px', color: '#A50021', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
                      {new Date(m.meeting_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: 'Oswald, sans-serif' }}>
                      {new Date(m.meeting_date).getDate()}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, color: '#323E48', marginBottom: '4px' }}>
                      {m.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#697077' }}>By {m.author}</span>
                      {m.attendees && (
                        <span style={{ fontSize: '10px', color: '#697077' }}>👥 {m.attendees.length} attendees</span>
                      )}
                      {m.action_items && (
                        <span style={{ fontSize: '10px', color: '#A50021', fontWeight: 600 }}>✅ {m.action_items.length} action items</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#8a9199' }}>{openNote === m.id ? '▲' : '▼'}</span>
                </button>

                {openNote === m.id && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #EAECEE' }}>
                    {m.body && (
                      <div style={{ marginTop: '14px', marginBottom: '16px' }}>
                        <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Notes</p>
                        <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7 }}>{m.body}</p>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {m.attendees && m.attendees.length > 0 && (
                        <div>
                          <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Attendees</p>
                          {m.attendees.map((attendee: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <div style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                background: avatarColor(attendee),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
                                fontFamily: 'Oswald, sans-serif'
                              }}>
                                {initials(attendee)}
                              </div>
                              <span style={{ fontSize: '11px', color: '#323E48' }}>{attendee}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {m.action_items && m.action_items.length > 0 && (
                        <div>
                          <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Action Items</p>
                          {m.action_items.map((item: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#A50021', flexShrink: 0 }}>☐</span>
                              <span style={{ fontSize: '11px', color: '#323E48', lineHeight: 1.5 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #EAECEE' }}>
                      <button style={{ padding: '6px 14px', background: '#323E48', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                        View Full Notes
                      </button>
                      <button style={{ padding: '6px 14px', background: '#ffffff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button style={{
              padding: '14px', background: 'transparent',
              border: '2px dashed #CCCCCC', borderRadius: '8px',
              fontSize: '12px', color: '#697077', cursor: 'pointer',
              fontFamily: 'Oswald, sans-serif', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.3px'
            }}>
              + Add Meeting Notes
            </button>
          </div>
        )}

        {/* ── SHARED DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ background: '#ffffff', border: '1px solid #CCCCCC', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '12px' }}>
              <div style={{ padding: '12px 16px', background: '#323E48', borderBottom: '1px solid #CCCCCC' }}>
                <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Shared Documents
                </p>
              </div>
              {data?.documents?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                  <p style={{ fontSize: '13px', color: '#697077', marginBottom: '16px' }}>No shared documents yet.</p>
                  <button style={{ padding: '10px 20px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                    + Upload First Document
                  </button>
                </div>
              ) : data.documents.map((d: any, i: number) => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 18px',
                  borderBottom: i < data.documents.length - 1 ? '1px solid #EAECEE' : 'none',
                  background: i % 2 === 0 ? '#ffffff' : '#F4F5F6'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '6px',
                    background: '#EAECEE', color: '#A50021',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, flexShrink: 0,
                    fontFamily: 'Oswald, sans-serif'
                  }}>
                    {d.file_type?.toUpperCase() || 'DOC'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#323E48', marginBottom: '2px' }}>{d.title}</p>
                    <p style={{ fontSize: '10px', color: '#8a9199' }}>
                      {d.category && `${d.category} · `}Uploaded by {d.uploaded_by}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '5px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>Open</button>
                    <button style={{ padding: '5px 10px', background: '#ffffff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>⬇️</button>
                  </div>
                </div>
              ))}
            </div>
            <button style={{
              width: '100%', padding: '14px', background: 'transparent',
              border: '2px dashed #CCCCCC', borderRadius: '8px',
              fontSize: '12px', color: '#697077', cursor: 'pointer',
              fontFamily: 'Oswald, sans-serif', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.3px'
            }}>
              + Upload Document
            </button>
          </div>
        )}

        {/* ── TEAM DIRECTORY ── */}
        {activeTab === 'team' && (
          <div>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Your PS Team
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {data?.team?.filter((m: any) => m.is_ps_team).map((member: any) => (
                <div key={member.id} style={{
                  background: '#ffffff', border: '1px solid #CCCCCC',
                  borderLeft: '4px solid #A50021',
                  borderRadius: '8px', padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(50,62,72,.08)',
                  display: 'flex', alignItems: 'flex-start', gap: '14px'
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: '#1F3864',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
                    fontFamily: 'Oswald, sans-serif'
                  }}>
                    {initials(member.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, color: '#323E48', marginBottom: '2px' }}>
                      {member.name}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#A50021', fontWeight: 600, marginBottom: '6px' }}>{member.role}</p>
                    {member.email && (
                      <a href={`mailto:${member.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#00538C', textDecoration: 'none', marginBottom: '8px' }}>
                        ✉️ {member.email}
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ padding: '5px 12px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                        Message
                      </button>
                      <button style={{ padding: '5px 12px', background: '#ffffff', color: '#323E48', border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                        📅 Schedule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data?.team?.filter((m: any) => !m.is_ps_team).length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '12px', fontWeight: 700, color: '#8a9199', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Institution Team
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {data?.team?.filter((m: any) => !m.is_ps_team).map((member: any) => (
                    <div key={member.id} style={{
                      background: '#ffffff', border: '1px solid #CCCCCC',
                      borderRadius: '8px', padding: '16px 18px',
                      boxShadow: '0 1px 3px rgba(50,62,72,.08)',
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: avatarColor(member.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                        fontFamily: 'Oswald, sans-serif'
                      }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#323E48' }}>{member.name}</p>
                        <p style={{ fontSize: '10px', color: '#697077' }}>{member.role}</p>
                        {member.email && (
                          <a href={`mailto:${member.email}`} style={{ fontSize: '10px', color: '#00538C', textDecoration: 'none' }}>
                            {member.email}
                          </a>
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
            <div style={{ background: '#ffffff', border: '1px solid #CCCCCC', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(50,62,72,.08)', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '11px', fontWeight: 700, color: '#323E48', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>
                Start a New Discussion
              </p>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="What would you like to discuss with your PS team?"
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '12px',
                  border: '1px solid #CCCCCC', borderRadius: '6px',
                  resize: 'none', height: '70px', color: '#323E48',
                  outline: 'none', fontFamily: 'Roboto, sans-serif'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setNewMessage('')}
                  style={{ padding: '7px 18px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}
                >
                  Post Discussion
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.discussions?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '8px', border: '1px solid #CCCCCC' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  <p style={{ fontSize: '13px', color: '#697077' }}>No discussions yet. Start one above.</p>
                </div>
              ) : data?.discussions?.map((d: any) => (
                <div key={d.id} style={{
                  background: '#ffffff', border: '1px solid #CCCCCC',
                  borderLeft: d.is_pinned ? '4px solid #A50021' : '4px solid #CCCCCC',
                  borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => setOpenDiscussion(openDiscussion === d.id ? null : d.id)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none',
                      border: 'none', padding: '16px 20px', cursor: 'pointer',
                      display: 'flex', alignItems: 'flex-start', gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: avatarColor(d.author),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                      fontFamily: 'Oswald, sans-serif'
                    }}>
                      {initials(d.author)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {d.is_pinned && (
                          <span style={{ fontSize: '9px', background: '#A50021', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
                            Pinned
                          </span>
                        )}
                        <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '13px', fontWeight: 700, color: '#323E48' }}>{d.title}</h3>
                      </div>
                      <p style={{ fontSize: '11px', color: '#697077', lineHeight: 1.5, marginBottom: '6px' }}>
                        {d.body?.substring(0, 120)}{d.body?.length > 120 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#697077' }}>By {d.author}</span>
                        <span style={{ fontSize: '10px', color: '#8a9199' }}>
                          {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '10px', color: '#A50021', fontWeight: 600 }}>
                          💬 {d.reply_count || 0} replies
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8a9199', flexShrink: 0 }}>
                      {openDiscussion === d.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {openDiscussion === d.id && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid #EAECEE' }}>
                      <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, margin: '14px 0' }}>{d.body}</p>
                      <div style={{ background: '#F4F5F6', borderRadius: '6px', padding: '10px 14px', marginBottom: '10px' }}>
                        <p style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', color: '#8a9199', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>
                          Reply
                        </p>
                        <textarea
                          placeholder="Type your reply..."
                          style={{
                            width: '100%', padding: '8px 12px', fontSize: '11px',
                            border: '1px solid #CCCCCC', borderRadius: '5px',
                            resize: 'none', height: '60px', color: '#323E48',
                            outline: 'none', fontFamily: 'Roboto, sans-serif',
                            background: '#fff'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button style={{ padding: '5px 14px', background: '#A50021', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
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
