'use client'

import { useEffect, useState } from 'react'

const BEST_PRACTICES = [
  {
    title: 'Preventive Maintenance Optimization',
    description: 'Best practices for structuring PM schedules, frequency rules, and seasonal adjustments for higher education facilities.',
    author: 'Amanda Rivera',
    readTime: '8 min read',
    tag: 'Best Practice',
    icon: '🔧'
  },
  {
    title: 'Work Order Priority Matrix',
    description: 'How to configure a tiered priority system that routes work orders automatically based on location, asset type, and urgency.',
    author: 'James Thornton',
    readTime: '6 min read',
    tag: 'Configuration',
    icon: '📋'
  },
  {
    title: 'Space Data Accuracy — HE Framework',
    description: 'A proven framework for achieving 90%+ space data accuracy across large multi-building campuses.',
    author: 'Chris Nguyen',
    readTime: '10 min read',
    tag: 'Best Practice',
    icon: '🏢'
  },
  {
    title: 'Integration Health Monitoring',
    description: 'How to set up monitoring, alerting, and SLA tracking for your AiM integrations with Banner, AD, and Kronos.',
    author: 'Amanda Rivera',
    readTime: '7 min read',
    tag: 'Integration',
    icon: '🔗'
  }
]

export default function TrainingLearning() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sessions')
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/training')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading training content...</p>
    </div>
  )

  const tabs = [
    { id: 'sessions', label: 'Recorded Sessions' },
    { id: 'materials', label: 'Training Materials' },
    { id: 'bestpractices', label: 'Best Practice Guides' },
  ]

  const filteredSessions = data?.sessions?.filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  ) || []

  const filteredMaterials = data?.materials?.filter((m: any) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  ) || []

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
            Training & Learning
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Recorded sessions · Training materials · Best practice guides
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search training content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px 8px 36px', fontSize: '12px',
              border: '1px solid #CCCCCC', borderRadius: '6px',
              color: '#323E48', outline: 'none', width: '240px',
              background: '#ffffff'
            }}
          />
        </div>
      </div>

      <div style={{ padding: '24px 28px 60px' }}>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Recorded Sessions', value: data?.sessions?.length || 0, icon: '🎬' },
            { label: 'Training Materials', value: data?.materials?.length || 0, icon: '📁' },
            { label: 'Best Practice Guides', value: BEST_PRACTICES.length, icon: '⭐' },
          ].map((k, i) => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #CCCCCC',
              borderTop: '4px solid #A50021',
              borderRadius: '8px',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(50,62,72,.08)'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{k.icon}</div>
              <div style={{
                fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                letterSpacing: '1px', fontSize: '11px', color: '#8a9199', marginBottom: '4px'
              }}>
                {k.label}
              </div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', fontWeight: 700, color: '#323E48' }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #CCCCCC',
          marginBottom: '20px',
          background: '#ffffff',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden'
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '12px 16px',
                fontFamily: 'Oswald, sans-serif', fontSize: '12px',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px',
                color: activeTab === t.id ? '#A50021' : '#697077',
                background: activeTab === t.id ? '#ffffff' : '#F4F5F6',
                border: 'none',
                borderBottom: activeTab === t.id ? '3px solid #A50021' : '3px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* RECORDED SESSIONS */}
        {activeTab === 'sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredSessions.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px', background: '#ffffff',
                borderRadius: '8px', border: '1px solid #CCCCCC'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎬</div>
                <p style={{ fontSize: '13px', color: '#697077' }}>No sessions found.</p>
              </div>
            ) : filteredSessions.map((s: any) => (
              <div key={s.id} style={{
                background: '#ffffff',
                border: '2px solid #A50021',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(165,0,33,0.10)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setPlayingVideo(playingVideo === s.id ? null : s.id)}
                  style={{
                    width: '100%',
                    background: '#1F3864',
                    border: 'none',
                    padding: '22px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                    border: '2px solid rgba(255,255,255,0.25)'
                  }}>
                    {playingVideo === s.id ? '⏸' : '▶'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontFamily: 'Oswald, sans-serif', fontSize: '15px',
                      fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1.4
                    }}>
                      {s.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                        👤 {s.presenter}
                      </span>
                      {s.duration_min && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                          🕐 {s.duration_min} min
                        </span>
                      )}
                      <span style={{
                        fontSize: '9px', background: '#A50021', color: '#ffffff',
                        padding: '2px 8px', borderRadius: '3px', fontWeight: 700,
                        fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                      }}>
                        {s.type?.toUpperCase() || 'RECORDED'}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.7)',
                    fontWeight: 600, flexShrink: 0,
                    fontFamily: 'Oswald, sans-serif'
                  }}>
                    {playingVideo === s.id ? 'Close ✕' : 'Watch →'}
                  </span>
                </button>

                {playingVideo === s.id && (
                  <div style={{ padding: '18px 22px', borderTop: '1px solid #EAECEE' }}>
                    <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, marginBottom: '16px' }}>
                      {s.description || 'No description available for this session.'}
                    </p>
                    <div style={{
                      background: '#0f172a', borderRadius: '8px', height: '180px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '16px', flexDirection: 'column', gap: '8px'
                    }}>
                      <div style={{ fontSize: '36px' }}>🎬</div>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        Video player — connect your video hosting URL
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{
                        padding: '7px 16px', background: '#A50021', color: '#fff',
                        border: 'none', borderRadius: '5px', fontSize: '11px',
                        fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                      }}>
                        ▶ Play Session
                      </button>
                      <button style={{
                        padding: '7px 16px', background: '#ffffff', color: '#323E48',
                        border: '1px solid #CCCCCC', borderRadius: '5px',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                      }}>
                        ⬇️ Download
                      </button>
                      <button style={{
                        padding: '7px 16px', background: '#ffffff', color: '#323E48',
                        border: '1px solid #CCCCCC', borderRadius: '5px',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                      }}>
                        🔗 Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TRAINING MATERIALS */}
        {activeTab === 'materials' && (
          <div style={{
            background: '#ffffff',
            border: '2px solid #A50021',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(165,0,33,0.10)'
          }}>
            <div style={{
              padding: '12px 16px',
              background: '#A50021',
              borderBottom: '1px solid #8E1537'
            }}>
              <p style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '11px',
                fontWeight: 600, color: '#ffffff',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}>
                Training Materials — {filteredMaterials.length} items
              </p>
            </div>
            {filteredMaterials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                <p style={{ fontSize: '13px', color: '#697077' }}>No materials found.</p>
              </div>
            ) : filteredMaterials.map((m: any, i: number) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px',
                borderBottom: i < filteredMaterials.length - 1 ? '1px solid #EAECEE' : 'none',
                background: i % 2 === 0 ? '#ffffff' : '#F4F5F6'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '6px',
                  background: '#FBE7EA', color: '#A50021',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, flexShrink: 0,
                  fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                }}>
                  {m.type === 'guide' ? 'GDE' : m.type === 'checklist' ? 'CHK' : 'DOC'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#323E48', marginBottom: '3px' }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#697077', marginBottom: '3px' }}>
                    {m.description || 'No description available.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '9px', padding: '2px 7px', borderRadius: '3px',
                      fontWeight: 700, background: '#FBE7EA', color: '#A50021',
                      fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                    }}>
                      {m.type?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '10px', color: '#8a9199' }}>By {m.author}</span>
                    {m.category && (
                      <span style={{ fontSize: '10px', color: '#8a9199' }}>· {m.category}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button style={{
                    padding: '6px 14px', background: '#A50021', color: '#fff',
                    border: 'none', borderRadius: '5px', fontSize: '11px',
                    fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                  }}>
                    Open
                  </button>
                  <button style={{
                    padding: '6px 12px', background: '#ffffff', color: '#323E48',
                    border: '1px solid #CCCCCC', borderRadius: '5px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                  }}>
                    ⬇️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BEST PRACTICE GUIDES */}
        {activeTab === 'bestpractices' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {BEST_PRACTICES.filter(g =>
              g.title.toLowerCase().includes(search.toLowerCase())
            ).map((guide, i) => (
              <div key={i} style={{
                background: '#ffffff',
                border: '2px solid #A50021',
                borderTop: '5px solid #A50021',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(165,0,33,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '28px' }}>{guide.icon}</div>
                <span style={{
                  fontSize: '9px', background: '#FBE7EA', color: '#A50021',
                  padding: '2px 7px', borderRadius: '3px', fontWeight: 700,
                  fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase',
                  display: 'inline-block', width: 'fit-content'
                }}>
                  {guide.tag}
                </span>
                <h3 style={{
                  fontFamily: 'Oswald, sans-serif', fontSize: '14px',
                  fontWeight: 700, color: '#323E48', lineHeight: 1.4
                }}>
                  {guide.title}
                </h3>
                <p style={{ fontSize: '11px', color: '#697077', lineHeight: 1.65, flex: 1 }}>
                  {guide.description}
                </p>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', paddingTop: '10px',
                  borderTop: '1px solid #EAECEE'
                }}>
                  <span style={{ fontSize: '10px', color: '#8a9199' }}>
                    By {guide.author} · {guide.readTime}
                  </span>
                  <button style={{
                    padding: '6px 14px', background: '#A50021', color: '#fff',
                    border: 'none', borderRadius: '5px', fontSize: '11px',
                    fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                  }}>
                    Read →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
