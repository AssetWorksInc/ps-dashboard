'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/')
      } else {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: '#1B2A4A', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '26px',
            margin: '0 auto 14px'
          }}>
            🏢
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1B2A4A', marginBottom: '4px' }}>
            PS Portal
          </h1>
          <p style={{ fontSize: '12px', color: '#4A5568' }}>
            AssetWorks Professional Services
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Email */}
          <div>
            <label style={{
              fontSize: '11px', fontWeight: 700, color: '#4A5568',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'block', marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="test@assetworks.com"
              style={{
                width: '100%', padding: '11px 14px', fontSize: '13px',
                border: '1px solid #E2E8F0', borderRadius: '8px',
                color: '#1B2A4A', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              fontSize: '11px', fontWeight: 700, color: '#4A5568',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'block', marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '11px 14px', fontSize: '13px',
                border: '1px solid #E2E8F0', borderRadius: '8px',
                color: '#1B2A4A', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: '8px',
              fontSize: '12px', color: '#C53030'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#94a3b8' : '#1B2A4A',
              color: '#ffffff', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              marginTop: '4px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: '20px', padding: '12px 14px',
          background: '#F7F8FA', borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#4A5568', marginBottom: '6px' }}>
            DEMO CREDENTIALS
          </p>
          <p style={{ fontSize: '11px', color: '#4A5568', lineHeight: 1.6 }}>
            📧 test@assetworks.com<br />
            🔑 Demo2026!
          </p>
        </div>

        <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '16px' }}>
          Need access? Contact your PS team.
        </p>
      </div>
    </div>
  )
}
