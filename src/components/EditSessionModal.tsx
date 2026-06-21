import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { formatDuration } from '../lib/utils'
import './EditSessionModal.css'

export function EditSessionModal() {
  const { pendingEditEntryId, timeEntries, cancelEditSession, confirmEditSession, deleteSession } = useData()

  const entry = timeEntries.find((e) => e.id === pendingEditEntryId)
  const open = Boolean(pendingEditEntryId && entry)

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !entry) return

    const startDate = new Date(entry.started_at)
    const endDate = entry.ended_at ? new Date(entry.ended_at) : new Date()

    const startStr = startDate.toISOString().slice(0, 16)
    const endStr = endDate.toISOString().slice(0, 16)

    setStartTime(startStr)
    setEndTime(endStr)
    setNote(entry.note || '')
    setError(null)
  }, [open, entry])

  const handleConfirm = async () => {
    if (!pendingEditEntryId || !startTime || !endTime) return

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      setError('End time must be after start time')
      return
    }

    setSaving(true)
    try {
      const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
      await confirmEditSession(pendingEditEntryId, {
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: durationSeconds,
        note: note.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingEditEntryId) return
    if (!confirm('Are you sure you want to delete this session?')) return

    setSaving(true)
    try {
      await deleteSession(pendingEditEntryId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
      setSaving(false)
    }
  }

  if (!open || !entry) return null

  const currentDuration = startTime && endTime ? Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : 0

  return (
    <div className="modal-overlay" onClick={() => !saving && cancelEditSession()}>
      <dialog className="modal edit-session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Session</h2>
          <button
            type="button"
            className="modal-close"
            onClick={() => !saving && cancelEditSession()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="start-time">Start Time</label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-time">End Time</label>
            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration</label>
            <div className="duration-display">
              {currentDuration > 0 ? formatDuration(currentDuration) : '0s'}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="note">Session Note</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for this session..."
              disabled={saving}
              rows={3}
            />
          </div>

          {error && (
            <p className="error-message" aria-live="polite">
              {error}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={saving}
          >
            Delete Session
          </button>
          <div className="actions-right">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => !saving && cancelEditSession()}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={saving || !startTime || !endTime}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
