'use client'

import { useState } from 'react'

const TEAM = [
  { name: 'Amanda Rivera', role: 'Dedicated CSM', initials: 'AR', color: '#0D7C66', status: 'online' },
  { name: 'James Thornton', role: 'Senior Consultant', initials: 'JT', color: '#2E86C1', status: 'away' },
  { name: 'Chris Nguyen', role: 'Integration Specialist', initials: 'CN', color: '#1B2A4A', status: 'online' },
]

const AI_REPLIES: { keywords: string[], reply: string }[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    reply: 'Hello! Welcome to the Lakewood State PS Portal. I\'m the PS AI assistant. I can help with project status, deliverables, scheduling, and general questions. How can I help you today?'
  },
  {
    keywords: ['project', 'status', 'progress', 'update'],
    reply: 'You currently have 2 active projects: PS Subscription Onboarding (35% complete, On Track) and AiM 12.x Upgrade (68% complete, At Risk). Would you like more details on either project?'
  },
  {
    keywords: ['upgrade', 'aim', 'version', '12.3'],
    reply: 'Your AiM 12.3 upgrade is scheduled for July 12, 2026. The project is currently At Risk due to a pending upgrade window confirmation. Please confirm with James Thornton at your earliest convenience.'
  },
  {
    keywords: ['deliverable', 'checklist', 'milestone', 'due'],
    reply: 'Your upcoming deliverables include: H2 Health Check (Jun 18), Q2 Business Review (Jul 15), and Space Utilization Dashboard Setup (in progress). Would you like the full deliverables list?'
  },
  {
    keywords: ['appointment', 'schedule', 'meeting', 'call', 'book'],
    reply: 'Your next scheduled session is the Weekly CSM Call on June 12 with Amanda Rivera via Microsoft Teams. You can book additional sessions directly from the Schedule section in the sidebar.'
  },
  {
    keywords: ['health', 'score', 'system', 'performance'],
    reply: 'Your last system health check was completed on March 12 by James Thornton. Overall health score: 92/100. Your next health check is scheduled for June 18 onsite at Lakewood Campus.'
  },
  {
    keywords: ['integration', 'banner', 'kronos', 'active directory', 'connect'],
    reply: 'You have 4 active integrations: Banner ERP, Active Directory, Kronos Timekeeping, and TouchNet Payment. Chris Nguyen is your integration specialist. Would you like to report an issue?'
  },
  {
    keywords: ['training', 'learn', 'guide', 'tutorial', 'video'],
    reply: 'Your training library includes 3 recorded sessions and 3 training materials. The most recent is the AiM Work Management Admin Training (90 min) presented by James Thornton. Visit the Training & Learning section for the full library.'
  },
  {
    keywords: ['document', 'file', 'upload', 'download', 'report'],
    reply: 'Your shared documents and reports are available in the Collaboration Hub under Shared Documents. Your latest report is the Q2 Health Report published June 1. Would you like me to pull up a specific document?'
  },
  {
    keywords: ['knowledge', 'sop', 'procedure', 'guide', 'etl'],
    reply: 'Your Knowledge Base has 3 sections: Visualize Documentation, ETL Guides, and SOPs & Implementation Resources. The most recently updated SOP is Emergency Work Order Escalation v3.1 (June 3, 2026).'
  },
  {
    keywords: ['urgent', 'emergency', 'critical', 'down', 'outage', 'problem'],
    reply: '🚨 For urgent issues please contact Amanda Rivera directly. I\'m also flagging this conversation as high priority. A PS team member will respond within 30 minutes during business hours.'
  },
  {
    keywords: ['contact', 'team', 'reach', 'email', 'phone', 'who'],
    reply: 'Your PS team: Amanda Rivera (Dedicated CSM) — amanda.rivera@psportal.com, James Thornton (Senior Consultant) — james.thornton@psportal.com, Chris Nguyen (Integration Specialist) — chris.nguyen@psportal.com.'
  },
  {
    keywords: ['thank', 'thanks', 'great', 'helpful', 'perfect'],
    reply: 'You\'re welcome! Is there anything else I can help you with? You can also reach your PS team directly by switching to a team member using the 👥 button above.'
  },
  {
    keywords: ['invoice', 'billing', 'payment', 'cost', 'price'],
    reply: 'For billing and invoice questions please contact your AssetWorks account manager. Your PS subscription is managed under the Full-Service tier. Amanda Rivera can help connect you with the right contact.'
  },
  {
    keywords: ['password', 'login', 'access', 'account', 'reset'],
    reply: 'For login and access issues please contact your institution\'s IT team. For AiM-specific access and role management Chris Nguyen can assist. Would you like to send him a message?'
  },
]

const DEFAULT_REPLY = 'Thanks for your message. I\'m the PS AI assistant for Lakewood State University. I can help with project status, deliverables, scheduling, integrations, and general questions. For complex issues I\'ll connect you with your PS team. Could you provide more details about what you need help with?'

interface Message {
  id: string
  from: 'user' | 'agent' | 'ai'
  text: string
  time: string
  agent?: string
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [activeAgent, setActiveAgent] = useState(TEAM[0])
  const [mode, setMode] = useState<'ai' | 'agent'>('ai')
  const [view, setView] = useState<'chat' | 'team'>('chat')
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'ai',
      text: 'Hi! I\'m the PS AI assistant for Lakewood State University. I can answer questions about your projects, deliverables, schedule, integrations, and more. You can also switch to chat with your PS team directly using the 👥 button above.',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  ])

  const getAIReply = (text: string): string => {
    const lower = text.toLowerCase()
    for (const item of AI_REPLIES) {
      if (item.keywords.some(k => lower.includes(k))) {
        return item.reply
      }
    }
    return DEFAULT_REPLY
  }

  const sendMessage = () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }

    const userText = input.trim()
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const replyText = mode === 'ai'
        ? getAIReply(userText)
        : `Thanks for your message. ${activeAgent.name} will respond shortly. ${activeAgent.status === 'away' ? 'They are currently away but will reply within 2 hours.' : 'They are online now.'}`

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        from: mode === 'ai' ? 'ai' : 'agent',
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        agent: mode === 'agent' ? activeAgent.name : undefined
      }
      setMessages(prev => [...prev, reply])
      setTyping(false)
    }, 1200)
  }

  const switchAgent = (agent: typeof TEAM[0]) => {
    setActiveAgent(agent)
    setMode('agent')
    setView('chat')
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: 'agent',
      text: `Hi! I'm ${agent.name}, ${agent.role}. I can see your conversation history. How can I help?`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      agent: agent.name
    }])
  }

  const switchToAI = () => {
    setMode('ai')
    setView('chat')
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      from: 'ai',
      text: 'Switched back to AI assistant. I\'m here to help with any questions about your projects, deliverables, and more.',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }])
  }

  const initials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase()

  const avatarColor = (name: string) => {
    const colors = ['#1B2A4A', '#0D7C66', '#2E86C1', '#B7791F', '#276749']
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false) }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#0D7C66',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(13,124,102,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            zIndex: 1000
          }}
          title="Chat with PS Team"
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '340px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>

          {/* Header */}
          <div style={{
            background: '#1B2A4A',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: mode === 'ai' ? '#0D7C66' : activeAgent.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: mode === 'ai' ? '18px' : '12px',
              fontWeight: 700, color: '#fff', flexShrink: 0, position: 'relative'
            }}>
              {mode === 'ai' ? '🤖' : activeAgent.initials}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#10b981', border: '2px solid #1B2A4A'
              }} />
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', marginBottom: '1px' }}>
                {mode === 'ai' ? 'PS AI Assistant' : activeAgent.name}
              </p>
              <p style={{ fontSize: '10px', color: '#64748b' }}>
                {mode === 'ai' ? '🟢 AI · Always available' : activeAgent.status === 'online' ? '🟢 Online now' : '🟡 Away · replies in 2hrs'}
              </p>
            </div>

            {/* Header buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setView(view === 'team' ? 'chat' : 'team')}
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Switch agent"
              >
                👥
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? '▲' : '▼'}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mode switcher */}
          {!minimized && (
            <div style={{ display: 'flex', background: '#F7F8FA', borderBottom: '1px solid #E2E8F0' }}>
              <button
                onClick={switchToAI}
                style={{
                  flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600,
                  color: mode === 'ai' ? '#0D7C66' : '#4A5568',
                  background: mode === 'ai' ? '#e6f4f1' : 'transparent',
                  border: 'none', borderBottom: mode === 'ai' ? '2px solid #0D7C66' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                🤖 AI Assistant
              </button>
              <button
                onClick={() => { setMode('agent'); setView('chat') }}
                style={{
                  flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600,
                  color: mode === 'agent' ? '#0D7C66' : '#4A5568',
                  background: mode === 'agent' ? '#e6f4f1' : 'transparent',
                  border: 'none', borderBottom: mode === 'agent' ? '2px solid #0D7C66' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                👤 Live Agent
              </button>
            </div>
          )}

          {/* Body */}
          {!minimized && (
            <>
              {/* TEAM VIEW */}
              {view === 'team' && (
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Your PS Team
                  </p>

                  {/* AI option */}
                  <button
                    onClick={switchToAI}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: mode === 'ai' ? '#e6f4f1' : '#F7F8FA',
                      border: mode === 'ai' ? '1px solid #0D7C66' : '1px solid transparent',
                      borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'
                    }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0D7C66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, position: 'relative' }}>
                      🤖
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B2A4A', marginBottom: '2px' }}>PS AI Assistant</p>
                      <p style={{ fontSize: '10px', color: '#4A5568' }}>Instant answers 24/7</p>
                      <p style={{ fontSize: '10px', color: '#0D7C66', fontWeight: 600 }}>● Always available</p>
                    </div>
                    {mode === 'ai' && (
                      <span style={{ fontSize: '9px', background: '#0D7C66', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>
                    )}
                  </button>

                  {/* Team members */}
                  {TEAM.map((member, i) => (
                    <button
                      key={i}
                      onClick={() => switchAgent(member)}
                      style={{
                        width: '100%', textAlign: 'left',
                        background: mode === 'agent' && activeAgent.name === member.name ? '#e6f4f1' : '#F7F8FA',
                        border: mode === 'agent' && activeAgent.name === member.name ? '1px solid #0D7C66' : '1px solid transparent',
                        borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0, position: 'relative' }}>
                        {member.initials}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: member.status === 'online' ? '#10b981' : '#f59e0b', border: '2px solid #fff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B2A4A', marginBottom: '2px' }}>{member.name}</p>
                        <p style={{ fontSize: '10px', color: '#4A5568' }}>{member.role}</p>
                        <p style={{ fontSize: '10px', color: member.status === 'online' ? '#0D7C66' : '#B7791F', fontWeight: 600 }}>
                          {member.status === 'online' ? '● Online' : '● Away'}
                        </p>
                      </div>
                      {mode === 'agent' && activeAgent.name === member.name && (
                        <span style={{ fontSize: '9px', background: '#0D7C66', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* CHAT VIEW */}
              {view === 'chat' && (
                <>
                  {/* Messages */}
                  <div style={{
                    height: '260px', overflowY: 'auto', padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: '10px', background: '#F7F8FA'
                  }}>
                    {messages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                        {(msg.from === 'agent' || msg.from === 'ai') && (
                          <p style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '3px', paddingLeft: '4px' }}>
                            {msg.from === 'ai' ? '🤖 PS AI Assistant' : `👤 ${msg.agent}`}
                          </p>
                        )}
                        <div style={{
                          maxWidth: '82%',
                          padding: '9px 12px',
                          borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: msg.from === 'user' ? '#1B2A4A' : msg.from === 'ai' ? '#e6f4f1' : '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          border: msg.from === 'ai' ? '1px solid #0D7C66' : 'none'
                        }}>
                          <p style={{ fontSize: '12px', color: msg.from === 'user' ? '#f1f5f9' : '#1B2A4A', lineHeight: 1.55 }}>
                            {msg.text}
                          </p>
                        </div>
                        <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                          {msg.time}
                        </p>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {typing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '12px 12px 12px 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0, 1, 2].map(i => (
                              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {mode === 'ai' ? 'AI thinking...' : `${activeAgent.name} is typing...`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick suggestions — AI mode only */}
                  {mode === 'ai' && messages.length <= 2 && (
                    <div style={{ padding: '8px 14px', background: '#ffffff', borderTop: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '6px' }}>Quick questions:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[
                          'Project status?',
                          'Next appointment?',
                          'Upcoming milestones?',
                          'My PS team?'
                        ].map((q, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInput(q)
                              setTimeout(() => {
                                const userMsg: Message = {
                                  id: Date.now().toString(),
                                  from: 'user',
                                  text: q,
                                  time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                }
                                setMessages(prev => [...prev, userMsg])
                                setTyping(true)
                                setTimeout(() => {
                                  const reply: Message = {
                                    id: (Date.now() + 1).toString(),
                                    from: 'ai',
                                    text: getAIReply(q),
                                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                  }
                                  setMessages(prev => [...prev, reply])
                                  setTyping(false)
                                  setInput('')
                                }, 1200)
                              }, 100)
                            }}
                            style={{
                              padding: '4px 10px', background: '#F7F8FA',
                              border: '1px solid #E2E8F0', borderRadius: '20px',
                              fontSize: '10px', color: '#1B2A4A', cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div style={{ padding: '10px 12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px', alignItems: 'flex-end', background: '#ffffff' }}>
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder={mode === 'ai' ? 'Ask the AI assistant...' : `Message ${activeAgent.name}...`}
                      style={{
                        flex: 1, padding: '9px 12px', fontSize: '12px',
                        border: '1px solid #E2E8F0', borderRadius: '8px',
                        resize: 'none', height: '38px', color: '#1B2A4A',
                        outline: 'none', fontFamily: 'inherit', lineHeight: 1.4
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      style={{
                        width: '38px', height: '38px', borderRadius: '8px',
                        background: input.trim() ? '#0D7C66' : '#E2E8F0',
                        border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', flexShrink: 0
                      }}
                    >
                      ➤
                    </button>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '6px 16px', background: '#F7F8FA', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <p style={{ fontSize: '9px', color: '#94a3b8' }}>
                      {mode === 'ai' ? '🤖 AI Assistant · Switch to 👤 Live Agent for human support' : '👤 Live Agent · Typical response: 2hrs'}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
