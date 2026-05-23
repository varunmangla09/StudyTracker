import { useMemo, type ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  action?: ReactNode
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function PageHeader({ title, subtitle, eyebrow, action }: PageHeaderProps) {
  const greeting = useMemo(() => getGreeting(), [])

  return (
    <header className={`page-hero${action ? ' has-action' : ''}`}>
      <div className="page-hero-copy">
        <p className="page-eyebrow">{eyebrow ?? greeting}</p>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-hero-action">{action}</div>}
    </header>
  )
}
