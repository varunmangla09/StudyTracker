export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/pwa-192.png' })
  } catch {
    // Service worker notifications need different path on some browsers
  }
}

let reminderInterval: ReturnType<typeof setInterval> | null = null

export function scheduleDailyReminder(time: string, enabled: boolean) {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
  }
  if (!enabled) return

  const [h, m] = time.split(':').map(Number)
  reminderInterval = setInterval(() => {
    const now = new Date()
    if (now.getHours() === h && now.getMinutes() === m) {
      const key = `reminder-${now.toDateString()}-${h}-${m}`
      if (!localStorage.getItem(key)) {
        showNotification('SwitchTrack', 'Time to work on your job-switch goals!')
        localStorage.setItem(key, '1')
      }
    }
  }, 60_000)
}

export function notifyGoalReached(label: string) {
  const key = `goal-${label}-${new Date().toDateString()}`
  if (localStorage.getItem(key)) return
  showNotification('Goal reached!', label)
  localStorage.setItem(key, '1')
}
