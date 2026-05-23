import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { requestNotificationPermission } from '../lib/notifications'
import { PageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/LoadingState'
import './Settings.css'

export function Settings() {
  const { user, signOut } = useAuth()
  const { settings, saveSettings, exportData, loading } = useData()

  const [weekday, setWeekday] = useState(120)
  const [weekendMin, setWeekendMin] = useState(240)
  const [weekendMax, setWeekendMax] = useState(360)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [goalAlert, setGoalAlert] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return

    queueMicrotask(() => {
      setWeekday(settings.weekday_goal_minutes)
      setWeekendMin(settings.weekend_min_goal_minutes)
      setWeekendMax(settings.weekend_max_goal_minutes)
      setReminderEnabled(settings.reminder_enabled)
      setReminderTime(settings.reminder_time)
      setGoalAlert(settings.goal_alert_enabled)
    })
  }, [settings])
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusError(null)
    setStatusMessage(null)

    if (weekendMax < weekendMin) {
      setStatusError('Weekend maximum must be greater than or equal to the weekend minimum.')
      return
    }

    try {
      await saveSettings({
        weekday_goal_minutes: weekday,
        weekend_min_goal_minutes: weekendMin,
        weekend_max_goal_minutes: weekendMax,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        goal_alert_enabled: goalAlert,
      })
      setSaved(true)
      setStatusMessage('Settings saved successfully.')
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to save settings right now.')
    }
  }

  const enableNotifications = async () => {
    const ok = await requestNotificationPermission()
    if (ok) {
      setReminderEnabled(true)
      setStatusMessage('Browser notifications are enabled.')
      setStatusError(null)
      return
    }

    setStatusError('Notifications are blocked in this browser. Update your browser permissions and try again.')
  }

  const handleExport = async () => {
    setExporting(true)
    setStatusError(null)
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `switchtrack-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatusMessage('Your data export has started.')
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to export your data right now.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="page settings-page">
      <PageHeader title="Settings" subtitle={user?.email ?? 'Your account and preferences'} />

      <form className="settings-form" onSubmit={handleSave}>
        <section className="card">
          <h2>Goals</h2>
          <p className="hint">Weekdays: 2h default. Weekends: 4–6h range.</p>
          <label>
            Weekday goal (minutes)
            <input type="number" min={15} max={720} value={weekday} onChange={(e) => setWeekday(+e.target.value)} />
          </label>
          <label>
            Weekend minimum (minutes)
            <input type="number" min={30} max={720} value={weekendMin} onChange={(e) => setWeekendMin(+e.target.value)} />
          </label>
          <label>
            Weekend maximum (minutes)
            <input type="number" min={30} max={720} value={weekendMax} onChange={(e) => setWeekendMax(+e.target.value)} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={goalAlert} onChange={(e) => setGoalAlert(e.target.checked)} />
            Alert when daily goal is reached
          </label>
        </section>

        <section className="card">
          <h2>Reminders</h2>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
            />
            Daily reminder
          </label>
          <label>
            Reminder time
            <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
          </label>
          <button type="button" className="btn btn-ghost full" onClick={enableNotifications}>
            Enable browser notifications
          </button>
          <p className="hint">Keep this app installed on your phone for best results. Reminders work while the app is open or installed as PWA.</p>
        </section>

        <p className={`status-message${statusError ? ' error' : ''}`} aria-live="polite">
          {statusError ?? statusMessage ?? ' '}
        </p>
        <button type="submit" className="btn btn-primary full">
          {saved ? 'Saved!' : 'Save settings'}
        </button>
      </form>

      <section className="card">
        <h2>Data</h2>
        <button type="button" className="btn btn-ghost full" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export all data (JSON)'}
        </button>
      </section>

      <section className="card install-hint">
        <h2>Install on phone</h2>
        <p className="hint">
          <strong>iPhone:</strong> Safari → Share → Add to Home Screen.
          <br />
          <strong>Android:</strong> Chrome menu → Install app / Add to Home screen.
        </p>
      </section>

      <button type="button" className="btn btn-ghost full sign-out" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  )
}
