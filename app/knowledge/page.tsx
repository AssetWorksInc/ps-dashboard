'use client'

import { useEffect, useState } from 'react'

const TOPICS = [
  {
    id: 'visualize',
    label: 'Visualize Documentation',
    icon: '📊',
    description: 'Interactive diagrams, system maps, data flows, and visual guides for your AssetWorks environment.',
    color: '#A50021',
    bg: '#FBE7EA',
    items: [
      { title: 'AiM System Architecture Diagram', type: 'diagram', updated: 'Jun 10, 2026' },
      { title: 'Work Order Workflow Map', type: 'diagram', updated: 'Jun 3, 2026' },
      { title: 'Space Utilization Data Flow', type: 'diagram', updated: 'May 28, 2026' },
      { title: 'Integration Topology — Banner & Kronos', type: 'diagram', updated: 'May 20, 2026' },
      { title: 'PM Schedule Hierarchy Visual', type: 'diagram', updated: 'May 15, 2026' },
    ]
  },
  {
    id: 'etl',
    label: 'ETL Guides',
    icon: '🔄',
    description: 'Data migration, transformation, and integration guides for connecting your systems to AiM.',
    color: '#A50021',
    bg: '#FBE7EA',
    items: [
      { title: 'Banner ERP to AiM Data Migration Guide', type: 'guide', updated: 'Jun 8, 2026' },
      { title: 'Active Directory Sync Configuration', type: 'guide', updated: 'Jun 1, 2026' },
      { title: 'Kronos Timekeeping Integration Setup', type: 'guide', updated: 'May 25, 2026' },
      { title: 'TouchNet Payment Gateway ETL', type: 'guide', updated: 'May 18, 2026' },
      { title: 'Data Validation & Quality Checks', type: 'guide', updated: 'May 10, 2026' },
    ]
  },
  {
    id: 'sops',
    label: 'SOPs & Implementation Resources',
    icon: '📋',
    description: 'Standard operating procedures, implementation checklists, and resources for your institution.',
    color: '#A50021',
    bg: '#FBE7EA',
    items: [
      { title: 'SOP: Emergency Work Order Escalation v3.1', type: 'sop', updated: 'Jun 3, 2026' },
      { title: 'SOP: New Hire System Onboarding', type: 'sop', updated: 'Mar 22, 2026' },
      { title: 'SOP: PM Schedule Management', type: 'sop', updated: 'May 1, 2026' },
      { title: 'AiM 12.3 Upgrade Readiness Checklist', type: 'checklist', updated: 'Jun 5, 2026' },
      { title: 'Go-Live Implementation Checklist', type: 'checklist', updated: 'Apr 15, 2026' },
    ]
  }
]

export default function KnowledgeBase() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTopic, setActiveTopic] = useState('visualize')
  const [search, setSearch] = useState('')
  const [openArticle, setOpenArticle] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/knowledge')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const currentTopic = TOPICS.find(t => t.id === activeTopic)!
  const filteredItems = currentTopic.items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  const typeLabel = (type: string) => {
    if (type === 'diagram') return 'Diagram'
    if (type === 'guide') return 'Guide'
    if (type === 'sop') return 'SOP'
    if (type === 'checklist') return 'Checklist'
    return 'Article'
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ fontSize: '32px' }}>⏳</div>
      <p style={{ color: '#697077', marginTop: '12px' }}>Loading knowledge base...</p>
    </div>
  )

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
            Knowledge Base
          </div>
          <div style={{ fontSize: '12px', color: '#697077' }}>
            Documentation · ETL guides · SOPs · Implementation resources
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search knowledge base..."
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

        {/* Topic selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {TOPICS.map(topic => (
            <button
              key={topic.id}
              onClick={() => { setActiveTopic(topic.id); setSearch(''); setOpenArticle(null) }}
              style={{
                textAlign: 'left', cursor: 'pointer',
                background: activeTopic === topic.id ? topic.bg : '#ffffff',
                border: activeTopic === topic.id ? `2px solid ${topic.color}` : '1px solid #CCCCCC',
                borderTop: activeTopic === topic.id ? `5px solid ${topic.color}` : '4px solid #CCCCCC',
                borderRadius: '8px', padding: '18px 20px',
                boxShadow: activeTopic === topic.id ? `0 2px 8px ${topic.color}22` : '0 1px 3px rgba(50,62,72,.08)',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{topic.icon}</div>
              <h3 style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '14px', fontWeight: 700,
                color: activeTopic === topic.id ? topic.color : '#323E48',
                marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.3px'
              }}>
                {topic.label}
              </h3>
              <p style={{ fontSize: '11px', color: '#697077', lineHeight: 1.6, marginBottom: '10px' }}>
                {topic.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: topic.color, fontFamily: 'Oswald, sans-serif' }}>
                  {topic.items.length} resources
                </span>
                {activeTopic === topic.id && (
                  <span style={{
                    fontSize: '9px', background: topic.color, color: '#fff',
                    padding: '2px 8px', borderRadius: '3px', fontWeight: 700,
                    fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                  }}>
                    Active
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Resource list */}
        <div style={{
          background: '#ffffff', border: '1px solid #CCCCCC',
          borderRadius: '8px', boxShadow: '0 1px 3px rgba(50,62,72,.08)',
          overflow: 'hidden'
        }}>

          {/* Section header */}
          <div style={{
            padding: '14px 22px',
            background: currentTopic.bg,
            borderBottom: `3px solid ${currentTopic.color}`,
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{ fontSize: '22px' }}>{currentTopic.icon}</span>
            <div>
              <h2 style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '14px', fontWeight: 700,
                color: '#323E48', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '2px'
              }}>
                {currentTopic.label}
              </h2>
              <p style={{ fontSize: '11px', color: '#697077' }}>
                {filteredItems.length} {filteredItems.length === 1 ? 'resource' : 'resources'} found
              </p>
            </div>
          </div>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontSize: '13px', color: '#697077' }}>No results for "{search}"</p>
              <button
                onClick={() => setSearch('')}
                style={{
                  marginTop: '12px', padding: '8px 16px', background: '#323E48',
                  color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif'
                }}
              >
                Clear search
              </button>
            </div>
          ) : filteredItems.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenArticle(openArticle === `${activeTopic}-${i}` ? null : `${activeTopic}-${i}`)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  borderBottom: '1px solid #EAECEE', padding: '14px 22px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F4F5F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '6px',
                  background: currentTopic.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '9px', fontWeight: 700,
                  color: currentTopic.color, flexShrink: 0, fontFamily: 'Oswald, sans-serif',
                  textTransform: 'uppercase'
                }}>
                  {typeLabel(item.type).substring(0, 3)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#323E48', marginBottom: '3px' }}>
                    {item.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '9px', padding: '2px 7px', borderRadius: '3px',
                      fontWeight: 700, background: currentTopic.bg,
                      color: currentTopic.color, fontFamily: 'Oswald, sans-serif',
                      textTransform: 'uppercase'
                    }}>
                      {typeLabel(item.type)}
                    </span>
                    <span style={{ fontSize: '10px', color: '#8a9199' }}>Updated {item.updated}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: currentTopic.color, fontWeight: 600 }}>View</span>
                  <span style={{ fontSize: '12px', color: '#8a9199' }}>
                    {openArticle === `${activeTopic}-${i}` ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {openArticle === `${activeTopic}-${i}` && (
                <div style={{
                  padding: '16px 22px 16px 72px',
                  background: '#F4F5F6',
                  borderBottom: '1px solid #CCCCCC'
                }}>
                  <p style={{ fontSize: '12px', color: '#697077', lineHeight: 1.7, marginBottom: '12px' }}>
                    This {typeLabel(item.type).toLowerCase()} covers key procedures and best practices for Lakewood State University's AssetWorks environment. Last reviewed by the PS team on {item.updated}.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      padding: '7px 16px', background: currentTopic.color, color: '#fff',
                      border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase'
                    }}>
                      Open Document
                    </button>
                    <button style={{
                      padding: '7px 16px', background: '#ffffff', color: '#323E48',
                      border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px',
                      fontWeight: 600, cursor: 'pointer'
                    }}>
                      ⬇️ Download
                    </button>
                    <button style={{
                      padding: '7px 16px', background: '#ffffff', color: '#323E48',
                      border: '1px solid #CCCCCC', borderRadius: '5px', fontSize: '11px',
                      fontWeight: 600, cursor: 'pointer'
                    }}>
                      🔗 Share Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Footer */}
          <div style={{
            padding: '14px 22px', borderTop: '1px solid #EAECEE',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <p style={{ fontSize: '11px', color: '#8a9199' }}>
              All resources maintained by your AssetWorks PS team
            </p>
            <button style={{
              padding: '7px 16px', background: '#323E48', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '11px',
              fontFamily: 'Oswald, sans-serif', fontWeight: 700,
              textTransform: 'uppercase', cursor: 'pointer'
            }}>
              + Request a Resource
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
