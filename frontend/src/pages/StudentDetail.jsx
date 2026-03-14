import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import { fetchStudent, logMentorAction } from '../api'

const SIGNAL_LABELS = {
  login_frequency: 'Login Frequency',
  assignment_rate: 'Assignment Rate',
  quiz_trend:      'Quiz Trend',
  session_duration:'Session Duration',
}

function penaltyColor(penalty, max) {
  const pct = penalty / max
  if (pct > 0.6) return 'var(--red)'
  if (pct > 0.3) return 'var(--yellow)'
  return 'var(--green)'
}

const SIGNAL_MAX = { login_frequency: 30, assignment_rate: 30, quiz_trend: 25, session_duration: 15 }

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [actions, setActions] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStudent(id)
      .then(d => { setData(d); setActions(d.mentor_actions || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">Loading student...</div>
  if (!data) return <div className="loading">Student not found.</div>

  const { student, current_risk, activity_logs, risk_history } = data
  const level = current_risk?.level || 'low'
  const score = current_risk?.score || 0
  const signals = current_risk?.signals || {}

  // Prepare activity chart data (last 14 days)
  const activityData = [...activity_logs]
    .reverse()
    .slice(-14)
    .map(l => ({
      date: l.date.slice(5),
      session: l.session_minutes,
      quiz: l.quiz_score,
      submitted: l.assignment_submitted ? 1 : 0,
    }))

  // Risk history chart
  const riskData = [...risk_history]
    .reverse()
    .map(r => ({ date: r.calculated_at.slice(5, 10), score: r.score }))

  const scoreColor = level === 'high' ? 'var(--red)' : level === 'medium' ? 'var(--yellow)' : 'var(--green)'

  async function handleLogAction() {
    if (!action.trim()) return
    setSaving(true)
    try {
      const res = await logMentorAction({
        student_id: student.id,
        mentor_email: student.mentor_email,
        action: action.trim(),
      })
      setActions(prev => [res, ...prev])
      setAction('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="detail-header">
        <div>
          <div className="detail-name">{student.name}</div>
          <div className="detail-meta">{student.course}</div>
          <div className="detail-meta" style={{ marginTop: 4 }}>
            Mentor: {student.mentor_email}
          </div>
          <div style={{ marginTop: 10 }}>
            <span className={`risk-badge ${level}`} style={{ fontSize: 13, padding: '4px 14px' }}>
              {level.toUpperCase()} RISK
            </span>
          </div>
        </div>
        <div className="big-score">
          <div className="big-score-num" style={{ color: scoreColor }}>{score.toFixed(0)}</div>
          <div className="big-score-label">Risk Score</div>
        </div>
      </div>

      {/* Signal breakdown */}
      <div className="signals-grid">
        {Object.entries(signals).map(([key, val]) => {
          const max = SIGNAL_MAX[key] || 30
          const color = penaltyColor(val.penalty, max)
          return (
            <div className="signal-card" key={key}>
              <div className="signal-name">{SIGNAL_LABELS[key] || key}</div>
              <div className="signal-value" style={{ color }}>{val.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                Penalty: {val.penalty?.toFixed(1)} / {max}
              </div>
              <div className="signal-penalty-bar">
                <div
                  className="signal-penalty-fill"
                  style={{
                    width: `${Math.min((val.penalty / max) * 100, 100)}%`,
                    background: color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Session activity chart */}
      <div className="chart-section">
        <div className="section-title">Session Duration — Last 14 Days (minutes)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activityData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="session" name="Minutes" radius={[3,3,0,0]}>
              {activityData.map((entry, i) => (
                <Cell key={i} fill={entry.session < 20 ? 'var(--red)' : entry.session < 45 ? 'var(--yellow)' : 'var(--green)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quiz score trend */}
      {activityData.some(d => d.quiz !== null) && (
        <div className="chart-section">
          <div className="section-title">Quiz Score Trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={activityData.filter(d => d.quiz)} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="quiz" name="Quiz Score" stroke={scoreColor} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk score history */}
      {riskData.length > 1 && (
        <div className="chart-section">
          <div className="section-title">Risk Score History</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={riskData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" name="Risk Score" stroke="var(--red)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mentor action log */}
      <div className="mentor-section">
        <div className="section-title">Mentor Action Log</div>
        <div className="action-form">
          <input
            className="action-input"
            placeholder="Log an action e.g. Called student, sent follow-up email..."
            value={action}
            onChange={e => setAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogAction()}
          />
          <button className="action-btn" onClick={handleLogAction} disabled={saving}>
            {saving ? 'Saving...' : 'Log Action'}
          </button>
        </div>
        {actions.length > 0 && (
          <div className="action-log">
            {actions.map((a, i) => (
              <div className="action-item" key={i}>
                <strong>{a.action}</strong>
                <span style={{ float: 'right' }}>{a.logged_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
