import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  eachDayOfInterval,
  subDays,
  isWeekend,
} from 'date-fns'

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function dateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function isToday(date: string): boolean {
  return date === todayStr()
}

export function entrySeconds(entry: { duration_seconds: number | null; started_at: string; ended_at: string | null }): number {
  if (entry.duration_seconds != null) return entry.duration_seconds
  if (!entry.ended_at) {
    return Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000)
  }
  return Math.floor((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 1000)
}

export function filterEntriesByDay<T extends { started_at: string }>(entries: T[], day: Date): T[] {
  const start = startOfDay(day)
  const end = endOfDay(day)
  return entries.filter((e) => {
    const t = parseISO(e.started_at)
    return isWithinInterval(t, { start, end })
  })
}

export function filterEntriesByMonth<T extends { started_at: string }>(entries: T[], month: Date): T[] {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return entries.filter((e) => {
    const t = parseISO(e.started_at)
    return isWithinInterval(t, { start, end })
  })
}

export function sumEntrySeconds(
  entries: { duration_seconds: number | null; started_at: string; ended_at: string | null }[]
): number {
  return entries.reduce((sum, e) => sum + entrySeconds(e), 0)
}

export function calcStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0
  const sorted = [...new Set(logDates)].sort().reverse()
  let streak = 0
  let check = startOfDay(new Date())

  for (const d of sorted) {
    const logDay = startOfDay(parseISO(d + 'T12:00:00'))
    if (format(logDay, 'yyyy-MM-dd') === format(check, 'yyyy-MM-dd')) {
      streak++
      check = subDays(check, 1)
    } else if (streak === 0 && format(logDay, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd')) {
      check = subDays(logDay, 1)
      streak++
      check = subDays(check, 1)
    } else {
      break
    }
  }
  return streak
}

export function getDayGoal(
  date: Date,
  settings: { weekday_goal_minutes: number; weekend_min_goal_minutes: number; weekend_max_goal_minutes: number }
): { min: number; max: number } {
  if (isWeekend(date)) {
    return {
      min: settings.weekend_min_goal_minutes * 60,
      max: settings.weekend_max_goal_minutes * 60,
    }
  }
  const sec = settings.weekday_goal_minutes * 60
  return { min: sec, max: sec }
}

export function last7Days(): Date[] {
  return eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
}
