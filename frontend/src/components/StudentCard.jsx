import { Link } from 'react-router-dom'

export default function StudentCard({ student }) {
  const risk = student.risk
  const level = risk?.level || 'low'
  const score = risk?.score || 0
  const signals = risk?.signals || {}

  const badSignals = Object.entries(signals).filter(([, v]) => v.penalty > 10).map(([k]) =>
    k.replace(/_/g, ' ')
  )

  return (
    <Link to={`/student/${student.id}`} className={`student-card ${level}`}>
      <div className="card-top">
        <div>
          <div className="student-name">{student.name}</div>
          <div className="student-course">{student.course}</div>
        </div>
        <span className={`risk-badge ${level}`}>{level}</span>
      </div>

      <div className="score-row">
        <div className="score-bar-wrap">
          <div className={`score-bar ${level}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`score-num ${level}`}>{score.toFixed(0)}</span>
      </div>

      <div className="signals-row">
        {badSignals.length > 0
          ? badSignals.map(s => <span key={s} className="signal-pill warn">⚠ {s}</span>)
          : <span className="signal-pill">✓ No critical signals</span>
        }
      </div>
    </Link>
  )
}
