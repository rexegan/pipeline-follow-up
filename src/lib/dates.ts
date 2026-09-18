/** Local-time yyyy-mm-dd for today, so comparisons match what a date input shows. */
export function today(): string {
  return toIso(new Date())
}

export function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00`)
  base.setDate(base.getDate() + days)
  return toIso(base)
}

export function daysUntil(isoDate: string): number | null {
  if (!isoDate) return null
  const target = Date.parse(`${isoDate}T00:00:00`)
  if (Number.isNaN(target)) return null
  const start = Date.parse(`${today()}T00:00:00`)
  return Math.round((target - start) / 86_400_000)
}

export function dueLabel(isoDate: string): string {
  const days = daysUntil(isoDate)
  if (days === null) return 'No date set'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days === -1) return 'Overdue by 1 day'
  if (days < 0) return `Overdue by ${-days} days`
  return `Due in ${days} days`
}

/** Monday-start week, matching how a work week is planned. */
export function startOfWeek(isoDate = today()): string {
  const d = new Date(`${isoDate}T00:00:00`)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return toIso(d)
}

export function endOfWeek(isoDate = today()): string {
  return addDays(startOfWeek(isoDate), 6)
}

export function endOfMonth(isoDate = today()): string {
  const d = new Date(`${isoDate}T00:00:00`)
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export function fmtDate(isoDate: string): string {
  if (!isoDate) return '—'
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Whole days since an ISO timestamp — how "days in stage" is measured. */
export function daysSince(isoTimestamp: string): number {
  const then = Date.parse(isoTimestamp)
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000))
}

/** Short relative stamp for an activity entry, e.g. "Today", "3d ago", "Sep 4". */
export function fmtWhen(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  if (Number.isNaN(d.getTime())) return ''
  const days = daysSince(isoTimestamp)
  if (toIso(d) === today()) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Whole dollars — pipeline figures don't need cents. */
export function fmtMoney(amount: number | null): string {
  if (amount === null || Number.isNaN(amount)) return '—'
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

/** Parse a typed dollar figure, tolerating $ and commas. Empty input means unknown. */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export const uid = (): string => crypto.randomUUID()
