import { useEffect, useRef, useState } from 'react'
import { useData } from '../context/DataContext'
import { MAX_SESSION_NOTE_LENGTH } from '../lib/types'
import './StartSessionModal.css'

export function StartSessionModal() {
  const { topics, pendingStartTopicId, cancelStartSession, confirmStartSession } = useData()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const topic = topics.find((t) => t.id === pendingStartTopicId)
  const open = Boolean(pendingStartTopicId && topic)

  useEffect(() => {
    if (!open) {
      setNote('')
      setError(null)
      setSaving(false)
      return
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open, pendingStartTopicId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelStartSession()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, cancelStartSession])

  if (!open || !topic) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await confirmStartSession(note.trim() || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start session.')
      setSaving(false)
    }
  }

  return (
    <div className="session-modal-backdrop" onClick={cancelStartSession} role="presentation">
      <div
        className="session-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-session-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="session-modal-header">
          <span className="session-modal-swatch" style={{ background: topic.color }} aria-hidden />
          <div>
            <h2 id="start-session-title">Start session</h2>
            <p className="hint">{topic.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            What are you working on? <span className="optional-tag">optional</span>
            <input
              ref={inputRef}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_SESSION_NOTE_LENGTH))}
              placeholder="e.g. HTML, React hooks, binary search"
              maxLength={MAX_SESSION_NOTE_LENGTH}
              autoComplete="off"
            />
          </label>
          <p className="hint char-count">
            {note.length}/{MAX_SESSION_NOTE_LENGTH}
          </p>
          {error && <p className="auth-error">{error}</p>}
          <div className="session-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={cancelStartSession} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Starting…' : 'Start timer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
