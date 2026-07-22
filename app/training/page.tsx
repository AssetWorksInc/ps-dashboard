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
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#4A5568', marginTop: '12px' }}>Loading training content...</p>
    </div>
  )

  const tabs = [
    { id: 'sessions', label: '🎬 Recorded Sessions' },
    { id: 'materials', label: '📁 Training Materials' },
    { id: 'bestpractices', label: '⭐ Best Practice Guides' },
  ]

  const filteredSessions = data?.sessions?.filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  ) || []

  const filteredMaterials = data?.materials?.filter((m: any) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1B2A4A', marginBottom: '4px' }}>
          🎓 Training & Learning
        </h1>
        <p style={{ fontSize: '13px', color: '#4A5568' }}>
          Recorded sessions, training materials, and best practice guides
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Recorded Sessions', value: data?.sessions?.length || 0, icon: '🎬', color: '#2E86C1' },
          { label: 'Training Materials', value: data?.materials?.length || 0, icon: '📁', color: '#0D7C66' },
          { label: 'Best Practice Guides', value: BEST_PRACTICES.length, icon: '⭐', color: '#B7791F' },
        ].map((k, i) => (
          <div key={i} style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            borderTop: `3px solid ${k.color}`
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{k.icon}</div>
            <div style={{ fontSize: '11px', color: '#4A5568', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1B2A4A' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search training content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 42px',
            fontSize: '13px',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            background: '#ffffff',
            color: '#1B2A4A',
            outline: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', background: '#ffffff', borderRadius: '10px', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: activeTab === t.id ? '#ffffff' : '#4A5568',
              background: activeTab === t.id ? '#1B2A4A' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s'
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
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎬</div>
              <p style={{ fontSize: '13px', color: '#4A5568' }}>No sessions found.</p>
            </div>
          ) : filteredSessions.map((s: any) => (
            <div key={s.id} style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              border: playingVideo === s.id ? '2px solid #2E86C1' : '2px solid transparent'
            }}>
              {/* Video thumbnail */}
              <button
                onClick={() => setPlayingVideo(playingVideo === s.id ? null : s.id)}
                style={{
                  width: '100%',
                  background: playingVideo === s.id ? '#1e293b' : 'linear-gradient(135deg, #1B2A4A, #2E86C1)',
                  border: 'none',
                  padding: '28px 22px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  {playingVideo === s.id ? '⏸' : '▶'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px', lineHeight: 1.4 }}>
                    {s.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                      👤 {s.presenter}
                    </span>
                    {s.duration_min && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                        🕐 {s.duration_min} min
                      </span>
                    )}
                    <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.15)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {s.type?.toUpperCase() || 'RECORDED'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, flexShrink: 0 }}>
                  {playingVideo === s.id ? 'Close ✕' : 'Watch →'}
                </span>
              </button>

              {/* Expanded content */}
              {playingVideo === s.id && (
                <div style={{ padding: '18px 22px', borderTop: '1px solid #F7F8FA' }}>
                  <p style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.7, marginBottom: '16px' }}>
                    {s.description || 'No description available for this session.'}
                  </p>
                  {/* Simulated video player */}
                  <div style={{
                    background: '#0f172a',
                    borderRadius: '10px',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '40px' }}>🎬</div>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>Video player — connect your video hosting URL</p>
                    <p style={{ fontSize: '10px', color: '#334155' }}>Supports YouTube, Vimeo, or direct MP4 links</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ padding: '7px 16px', background: '#2E86C1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      ▶ Play Session
                    </button>
                    <button style={{ padding: '7px 16px', background: '#ffffff', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      ⬇️ Download
                    </button>
                    <button style={{ padding: '7px 16px', background: '#ffffff', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredMaterials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
              <p style={{ fontSize: '13px', color: '#4A5568' }}>No materials found.</p>
            </div>
          ) : filteredMaterials.map((m: any) => (
            <div key={m.id} style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              {/* Icon */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#e6f4f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                {m.type === 'guide' ? '📖' : m.type === 'checklist' ? '✅' : '📄'}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1B2A4A', marginBottom: '4px' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '11px', color: '#4A5568', marginBottom: '4px' }}>
                  {m.description || 'No description available.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', background: '#e6f4f1', color: '#0D7C66', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {m.type?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>By {m.author}</span>
                  {m.category && (
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>· {m.category}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button style={{ padding: '6px 12px', background: '#0D7C66', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  Open
                </button>
                <button style={{ padding: '6px 12px', background: '#ffffff', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  ⬇️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BEST PRACTICE GUIDES */}
      {activeTab === 'bestpractices' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {BEST_PRACTICES.filter(g =>
            g.title.toLowerCase().includes(search.toLowerCase())
          ).map((guide, i) => (
            <div key={i} style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              borderTop: '3px solid #B7791F',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '28px' }}>{guide.icon}</div>
              <div>
                <span style={{ fontSize: '9px', background: '#fef3c7', color: '#B7791F', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                  {guide.tag.toUpperCase()}
                </span>
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1B2A4A', lineHeight: 1.4 }}>
                {guide.title}
              </h3>
              <p style={{ fontSize: '11px', color: '#4A5568', lineHeight: 1.65, flex: 1 }}>
                {guide.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F7F8FA' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  By {guide.author} · {guide.readTime}
                </span>
                <button style={{
                  padding: '6px 14px',
                  background: '#B7791F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Read →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
