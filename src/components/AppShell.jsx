import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useRegion } from '../context/useRegion'


const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/risk-map', label: 'Flood Risk Map', icon: '⌖' },
  { to: '/safe-routes', label: 'Flood-Safe Routes', icon: '⇢' },
  { to: '/nowcast', label: 'AI Nowcast', icon: '◒' },
  { to: '/explainable-ai', label: 'Explainable AI', icon: '◌' },
  { to: '/emergency-response', label: 'Emergency Response', icon: '!' },
]

function AppShell() {
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const { selectedRegion, setSelectedRegion, currentRegion, regions } = useRegion()

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>◒</span><div><strong>JalDrishti</strong><small>Urban Flood Monitoring</small></div></div>
        <nav className="main-nav" aria-label="Primary navigation">
          {navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><span className="nav-icon">{item.icon}</span>{item.label}</NavLink>)}
        </nav>
        <div className="sidebar-note"><span className="status-dot" /> Demonstration platform<p>Prototype environment</p></div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-region-selector-wrapper">
            <span className="topbar-kicker">{currentRegion?.kicker || 'URBAN FLOOD MONITORING'}</span>
            <div className="topbar-select-container">
              <select
                id="region-selector"
                className="topbar-region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                aria-label="Select demonstration region"
              >
                {regions.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="topbar-meta">
            <span className="live-indicator"><span className="status-dot" /> Demonstration scenario</span>
            <span>{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
          </div>
        </header>
        <main className="page-content"><div key={`${location.pathname}-${selectedRegion}`} className={`page-transition route-${location.pathname.slice(1).replaceAll('/', '-') || 'dashboard'}`}><Outlet /></div></main>
      </div>
    </div>
  )
}

export default AppShell

