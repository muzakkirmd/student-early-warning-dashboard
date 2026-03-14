import { useState, useRef } from 'react'

const API_BASE = '/api'

export default function IntegrationHub() {
  const [method, setMethod] = useState('csv')
  const [csvStatus, setCsvStatus] = useState(null)
  const [csvError, setCsvError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const [endpointCopied, setEndpointCopied] = useState(null)
  const fileRef = useRef()

  const DEMO_API_KEY = 'sk-ew-demo-' + btoa('student-warning').slice(0, 24)
  const BASE_URL = 'https://student-early-warning-dashboard.onrender.com'

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      setCsvError('Please upload a .csv file')
      return
    }
    setImporting(true)
    setCsvError(null)
    setCsvStatus(null)

    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))

    const required = ['name', 'email', 'course', 'mentor_email']
    const missing = required.filter(r => !headers.includes(r))
    if (missing.length > 0) {
      setCsvError(`Missing columns: ${missing.join(', ')}. Check the sample CSV.`)
      setImporting(false)
      return
    }

    const students = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      if (vals.length < 4 || !vals[0]) continue
      const row = {}
      headers.forEach((h, idx) => row[h] = vals[idx] || '')
      students.push(row)
    }

    if (students.length === 0) {
      setCsvError('No valid student rows found in CSV.')
      setImporting(false)
      return
    }

    let success = 0, failed = 0
    for (const s of students) {
      try {
        const res = await fetch(`${API_BASE}/ingest/student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        })
        if (res.ok) success++
        else failed++
      } catch { failed++ }
    }

    setCsvStatus({ total: students.length, success, failed })
    setImporting(false)
  }

  function downloadSample() {
    const csv = [
      'name,email,course,mentor_email',
      'Rahul Sharma,rahul@example.com,Full Stack Web Development,mentor@academy.com',
      'Priya Singh,priya@example.com,Data Science with Python,mentor@academy.com',
      'Aisha Khan,aisha@example.com,UI/UX Design,mentor2@academy.com',
      'Vikram Patel,vikram@example.com,Digital Marketing,mentor2@academy.com',
      'Sneha Reddy,sneha@example.com,Machine Learning Basics,mentor3@academy.com'
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_students.csv'
    a.click()
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    if (key === 'apikey') {
      setApiKeyCopied(true)
      setTimeout(() => setApiKeyCopied(false), 2000)
    } else {
      setEndpointCopied(key)
      setTimeout(() => setEndpointCopied(null), 2000)
    }
  }

  const endpoints = [
    { method: 'POST', path: '/api/ingest/student', desc: 'Add or update a student', color: '#059669' },
    { method: 'POST', path: '/api/ingest/event', desc: 'Send a student activity event', color: '#059669' },
    { method: 'GET',  path: '/api/students', desc: 'Get all students with risk scores', color: '#2563EB' },
    { method: 'GET',  path: '/api/risk-scores/high', desc: 'Get high-risk students only', color: '#2563EB' },
    { method: 'GET',  path: '/api/students/:id', desc: 'Get single student detail', color: '#2563EB' },
  ]

  const codeExample = `// Send student activity event
fetch('${BASE_URL}/api/ingest/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${DEMO_API_KEY}'
  },
  body: JSON.stringify({
    student_email: 'rahul@example.com',
    event_type: 'login',        // login | assignment | quiz
    session_minutes: 45,
    quiz_score: 78,             // optional
    assignment_submitted: true  // optional
  })
})`

  const crms = [
    { name: 'Salesforce', color: '#00A1E0', status: 'Ready', note: 'Via n8n workflow' },
    { name: 'Zoho CRM', color: '#E42527', status: 'Ready', note: 'Via n8n workflow' },
    { name: 'HubSpot', color: '#FF7A59', status: 'Ready', note: 'Via n8n workflow' },
    { name: 'Moodle LMS', color: '#F98012', status: 'Ready', note: 'Via REST API' },
    { name: 'Canvas LMS', color: '#E66000', status: 'Ready', note: 'Via REST API' },
    { name: 'Custom', color: '#6B7280', status: 'Any platform', note: 'Webhook support' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Integration hub</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Connect your student data to the dashboard — choose the method that works for your platform.
        </p>
      </div>

      {/* Method selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { id: 'csv', icon: '📄', title: 'CSV upload', desc: 'Upload a spreadsheet of students. Best for quick start.', tag: 'No code needed', tagColor: '#059669', tagBg: '#F0FDF4' },
          { id: 'api', icon: '🔌', title: 'REST API', desc: 'Send student events in real-time from your backend.', tag: 'For developers', tagColor: '#1D4ED8', tagBg: '#EFF6FF' },
          { id: 'crm', icon: '🔗', title: 'CRM / webhook', desc: 'Connect Salesforce, Zoho, Moodle via n8n workflow.', tag: 'Advanced', tagColor: '#6D28D9', tagBg: '#F5F3FF' },
        ].map(m => (
          <div
            key={m.id}
            onClick={() => setMethod(m.id)}
            style={{
              background: 'var(--surface)',
              border: method === m.id ? '2px solid #3B82F6' : '1px solid var(--border)',
              borderRadius: 12, padding: 16, cursor: 'pointer',
              transition: 'border-color 0.15s'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>{m.desc}</div>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 999, background: m.tagBg, color: m.tagColor }}>{m.tag}</span>
          </div>
        ))}
      </div>

      {/* Panel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>

        {/* CSV Panel */}
        {method === 'csv' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Upload student CSV</div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragOver ? '#3B82F6' : 'var(--border)'}`,
                borderRadius: 10, padding: 36, textAlign: 'center',
                cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.15s',
                background: dragOver ? '#EFF6FF' : 'transparent'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                {importing ? 'Importing students...' : 'Drag and drop your CSV here'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                or click to browse — max 10,000 students
              </div>
              {!importing && (
                <button className="filter-btn" onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
                  Choose file
                </button>
              )}
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            {csvError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991B1B', marginBottom: 14 }}>
                {csvError}
              </div>
            )}

            {csvStatus && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065F46', marginBottom: 14 }}>
                Imported {csvStatus.success} students successfully!
                {csvStatus.failed > 0 && ` (${csvStatus.failed} failed — duplicate emails skipped)`}
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Required columns
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {[
                { col: 'name', note: 'Student full name' },
                { col: 'email', note: 'Unique email ID' },
                { col: 'course', note: 'Course enrolled in' },
                { col: 'mentor_email', note: 'Assigned mentor' },
              ].map(c => (
                <div key={c.col} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.col}</div>
                  <div style={{ color: 'var(--muted)', marginTop: 2 }}>{c.note}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="filter-btn" onClick={downloadSample}>Download sample CSV</button>
            </div>
          </div>
        )}

        {/* API Panel */}
        {method === 'api' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>REST API integration</div>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Your API key</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', color: 'var(--text)' }}>
                {DEMO_API_KEY}
              </div>
              <button className="filter-btn" onClick={() => copyText(DEMO_API_KEY, 'apikey')}>
                {apiKeyCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Endpoints</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {endpoints.map((ep, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: ep.color + '20', color: ep.color, minWidth: 44, textAlign: 'center' }}>{ep.method}</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', flex: 1 }}>{ep.path}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ep.desc}</span>
                  <button className="filter-btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => copyText(BASE_URL + ep.path, i)}>
                    {endpointCopied === i ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Code example</div>
            <div style={{ background: '#1E1E1E', borderRadius: 10, padding: 16, position: 'relative' }}>
              <pre style={{ fontSize: 12, color: '#D4D4D4', fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto', margin: 0 }}>{codeExample}</pre>
              <button
                onClick={() => copyText(codeExample, 'code')}
                style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, padding: '3px 10px', background: '#333', color: '#ccc', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                {endpointCopied === 'code' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* CRM Panel */}
        {method === 'crm' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Connect your CRM or LMS</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Each integration uses an n8n workflow that syncs student activity automatically every 6 hours. No code needed on your end — just connect and go.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {crms.map((crm, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: crm.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: crm.color }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{crm.name}</div>
                  <div style={{ fontSize: 11, color: '#059669', marginBottom: 2 }}>{crm.status}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{crm.note}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#F9FAFB', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>How it works</div>
              {[
                '1. Share your API key with us',
                '2. We set up an n8n workflow connected to your CRM',
                '3. Every 6 hours, student activity syncs automatically',
                '4. Risk scores update in real-time on the dashboard',
              ].map((step, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--muted)', padding: '4px 0', lineHeight: 1.6 }}>{step}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
