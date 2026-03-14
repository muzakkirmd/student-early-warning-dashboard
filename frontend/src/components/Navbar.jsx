export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-dot" />
        <div>
          <div className="navbar-title">Student Early Warning Dashboard</div>
          <div className="navbar-sub">Real-time dropout risk detection</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        Built by <strong style={{ color: 'var(--text)' }}>muzakkirmd</strong>
      </div>
    </nav>
  )
}
