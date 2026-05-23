import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Topic } from '../lib/types'
import { formatDurationShort } from '../lib/utils'
import './TopicCard.css'

interface Props {
  topic: Topic
  seconds?: number
  streak?: number
  isActive?: boolean
  habitDone?: boolean
  onStart?: () => void
  onStop?: () => void
  onHabitTap?: () => void
  compact?: boolean
}

export function TopicCard({
  topic,
  seconds = 0,
  streak,
  isActive,
  habitDone,
  onStart,
  onStop,
  onHabitTap,
  compact,
}: Props) {
  if (topic.type === 'habit') {
    return (
      <article
        className={`topic-card card habit-card${habitDone ? ' done' : ''}`}
        style={{ '--topic-color': topic.color } as CSSProperties}
      >
        <div className="topic-card-main">
          <span className="topic-avatar" style={{ background: topic.color }} aria-hidden>
            {topic.name.charAt(0).toUpperCase()}
          </span>
          <div className="topic-body">
            <span className="topic-category">{topic.category}</span>
            <strong>{topic.name}</strong>
            {streak !== undefined && (
              <span className="streak-badge">
                <span className="streak-flame" aria-hidden>🔥</span>
                {streak} day{streak === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className={`btn habit-btn${habitDone ? ' done' : ''}`}
          onClick={onHabitTap}
          aria-pressed={habitDone}
        >
          {habitDone ? (
            <>
              <span aria-hidden>✓</span> Done
            </>
          ) : (
            'Check in'
          )}
        </button>
      </article>
    )
  }

  return (
    <article
      className={`topic-card card timer-card${isActive ? ' active' : ''}`}
      style={{ '--topic-color': topic.color } as CSSProperties}
    >
      <Link to={`/topics/${topic.id}`} className="topic-link">
        <span className="topic-avatar" style={{ background: topic.color }} aria-hidden>
          {topic.name.charAt(0).toUpperCase()}
        </span>
        <div className="topic-body">
          <span className="topic-category">{topic.category}</span>
          <strong>{topic.name}</strong>
          {!compact && (
            <span className="topic-time mono">
              {seconds > 0 ? `Today · ${formatDurationShort(seconds)}` : 'No time logged today'}
            </span>
          )}
        </div>
      </Link>
      {isActive ? (
        <button type="button" className="btn btn-danger timer-action" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button type="button" className="btn btn-primary timer-action" onClick={onStart}>
          Start
        </button>
      )}
    </article>
  )
}
