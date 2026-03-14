import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const loc = useLocation()
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-dot" />
        <div>
          <div className="navbar-title">Student Early Warning Dashboard</div>
          <div className="navbar-sub">Real-time dropout risk detection</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          to="/"
          style={{
            fontSize: 13, fontWeight: 500, padding: '5px 14px',
            borderRadius: 999, textDecoration: 'none',
            background: loc.pathname === '/' ? 'var(--text)' : 'transparent',
            color: loc.pathname === '/' ? 'var(--surface)' : 'var(--muted)',
            border: '1px solid',
            borderColor: loc.pathname === '/' ? 'var(--text)' : 'var(--border)',
            transition: 'all 0.15s'
          }}
        >
          Dashboard
        </Link>
        <Link
          to="/integrate"
          style={{
            fontSize: 13, fontWeight: 500, padding: '5px 14px',
            borderRadius: 999, textDecoration: 'none',
            background: loc.pathname === '/integrate' ? 'var(--text)' : 'transparent',
            color: loc.pathname === '/integrate' ? 'var(--surface)' : 'var(--muted)',
            border: '1px solid',
            borderColor: loc.pathname === '/integrate' ? 'var(--text)' : 'var(--border)',
            transition: 'all 0.15s'
          }}
        >
          Integrations
        </Link>
        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
          Built by <strong style={{ color: 'var(--text)' }}>muzakkirmd</strong>
        </span>
      </div>
    </nav>
  )
}
