import { NavLink, Outlet } from 'react-router-dom'
import { IconCharts, IconHome, IconSettings, IconTopics } from './NavIcons'
import { StartSessionModal } from './StartSessionModal'
import './Layout.css'

const nav = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/topics', label: 'Topics', Icon: IconTopics },
  { to: '/charts', label: 'Charts', Icon: IconCharts },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
] as const

export function Layout() {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-topbar">
        <div className="app-brand">
          <span className="app-logo" aria-hidden />
          <div>
            <strong>SwitchTrack</strong>
            <span>Job-switch focus</span>
          </div>
        </div>
      </header>
      <main id="main-content" className="layout-main">
        <Outlet />
      </main>
      <StartSessionModal />
      <nav className="bottom-nav" aria-label="Main">
        {nav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon-wrap">
              <Icon className="nav-icon" />
            </span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
