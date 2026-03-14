import { useEffect, useState } from 'react'
import { fetchStudents } from '../api'
import StudentCard from '../components/StudentCard'

export default function Dashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    high:   students.filter(s => s.risk?.level === 'high').length,
    medium: students.filter(s => s.risk?.level === 'medium').length,
    low:    students.filter(s => s.risk?.level === 'low').length,
  }

  const filtered = students.filter(s => {
    const matchFilter = filter === 'all' || s.risk?.level === filter
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.course.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if (loading) return <div className="loading">Loading students...</div>

  return (
    <div>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value total">{students.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Risk 🔴</div>
          <div className="stat-value red">{counts.high}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Medium Risk 🟡</div>
          <div className="stat-value yellow">{counts.medium}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Healthy 🟢</div>
          <div className="stat-value green">{counts.low}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alert Rate</div>
          <div className="stat-value red">
            {students.length ? Math.round((counts.high / students.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        {['all','high','medium','low'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? `active-${f}` : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${students.length})` :
             f === 'high' ? `🔴 High Risk (${counts.high})` :
             f === 'medium' ? `🟡 Medium (${counts.medium})` :
             `🟢 Healthy (${counts.low})`}
          </button>
        ))}
        <input
          className="search-input"
          placeholder="Search student or course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0
        ? <div className="empty">No students found.</div>
        : <div className="students-grid">
            {filtered.map(s => <StudentCard key={s.id} student={s} />)}
          </div>
      }
    </div>
  )
}
