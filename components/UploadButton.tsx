'use client'

import { useState, useRef } from 'react'

interface UploadButtonProps {
  onUploadComplete?: (document: any) => void
  uploadedBy?: string
}

export default function UploadButton({ onUploadComplete, uploadedBy = 'Portal User' }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const categories = [
    'General', 'Health Check', 'Business Review', 'Training',
    'SOP', 'Integration', 'Configuration', 'Release Notes', 'Contract'
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
      setShowModal(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title || selectedFile.name)
      formData.append('category', category)
      formData.append('uploadedBy', uploadedBy)
      formData.append('tenantSlug', 'lakewood')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Document uploaded successfully.' })
        setTimeout(() => {
          setShowModal(false)
          setSelectedFile(null)
          setTitle('')
          setCategory('General')
          setMessage(null)
          if (onUploadComplete) onUploadComplete(data.document)
        }, 1500)
      } else {
        setMessage({ type: 'error', text: `❌ Upload failed: ${data.error}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Something went wrong. Please try again.' })
    }
    setUploading(false)
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
      />

      {/* Upload trigger button */}
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '8px 18px',
          background: '#A50021',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontFamily: 'Oswald, sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        ⬆️ Upload Document
      </button>

      {/* Upload modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '28px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '2px solid #A50021'
          }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', fontWeight: 700, color: '#323E48', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                Upload Document
              </h2>
              <button
                onClick={() => { setShowModal(false); setSelectedFile(null); setTitle(''); setMessage(null) }}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#697077' }}
              >
                ✕
              </button>
            </div>

            {/* File info */}
            {selectedFile && (
              <div style={{ background: '#FBE7EA', border: '1px solid #A50021', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>
                  {selectedFile.name.endsWith('.pdf') ? '📕' :
                   selectedFile.name.match(/\.xlsx?$/) ? '📗' :
                   selectedFile.name.match(/\.docx?$/) ? '📘' :
                   selectedFile.name.match(/\.pptx?$/) ? '📙' : '📄'}
                </span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#323E48' }}>{selectedFile.name}</p>
                  <p style={{ fontSize: '10px', color: '#697077' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            {/* Title field */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#697077', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter document title..."
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px',
                  border: '1px solid #A50021', borderRadius: '6px',
                  color: '#323E48', outline: 'none',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>

            {/* Category field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: 'Oswald, sans-serif', fontSize: '10px', fontWeight: 700, color: '#697077', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '5px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px',
                  border: '1px solid #A50021', borderRadius: '6px',
                  color: '#323E48', background: '#ffffff', cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: '6px', marginBottom: '14px',
                fontSize: '12px', fontWeight: 600,
                background: message.type === 'success' ? '#E7F3E8' : '#FBE7EA',
                color: message.type === 'success' ? '#2E7D32' : '#A50021',
                border: `1px solid ${message.type === 'success' ? '#a3d9a5' : '#f5c6cb'}`
              }}>
                {message.text}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                style={{
                  flex: 1, padding: '11px',
                  background: uploading ? '#C9CFD4' : '#A50021',
                  color: '#ffffff', border: 'none', borderRadius: '6px',
                  fontFamily: 'Oswald, sans-serif', fontSize: '13px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px',
                  cursor: uploading ? 'default' : 'pointer'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Now'}
              </button>
              <button
                onClick={() => { setShowModal(false); setSelectedFile(null); setTitle(''); setMessage(null) }}
                style={{
                  padding: '11px 18px', background: '#ffffff', color: '#323E48',
                  border: '1px solid #CCCCCC', borderRadius: '6px',
                  fontFamily: 'Oswald, sans-serif', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
