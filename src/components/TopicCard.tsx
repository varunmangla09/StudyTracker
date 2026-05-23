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
      <div className={`topic-card card habit-card${habitDone ? ' done' : ''}`}>
        <div className="topic-color" style={{ background: topic.color }} />
        <div className="topic-body">
          <span className="topic-category">{topic.category}</span>
          <strong>{topic.name}</strong>
          {streak !== undefined && (
            <span className="streak">🔥 {streak} day streak</span>
          )}
        </div>
        <button
          type="button"
          className={`btn habit-btn${habitDone ? ' done' : ''}`}
          onClick={onHabitTap}
          aria-pressed={habitDone}
        >
          {habitDone ? '✓ Done' : 'Tap'}
        </button>
      </div>
    )
  }

  return (
    <div className={`topic-card card timer-card${isActive ? ' active' : ''}`}>
      <Link to={`/topics/${topic.id}`} className="topic-link">
        <div className="topic-color" style={{ background: topic.color }} />
        <div className="topic-body">
          <span className="topic-category">{topic.category}</span>
          <strong>{topic.name}</strong>
          {!compact && seconds > 0 && (
            <span className="topic-time">Today: {formatDurationShort(seconds)}</span>
          )}
        </div>
      </Link>
      {isActive ? (
        <button type="button" className="btn btn-danger" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start
        </button>
      )}
    </div>
  )
}
