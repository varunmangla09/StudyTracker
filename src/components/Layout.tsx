import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

const nav = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/topics', label: 'Topics', icon: '◎' },
  { to: '/charts', label: 'Charts', icon: '▤' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function Layout() {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content" className="layout-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Main">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon" aria-hidden>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
