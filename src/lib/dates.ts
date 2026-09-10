/** Local-time yyyy-mm-dd for today, so comparisons match what the date input shows. */
export function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function daysUntil(isoDate: string): number | null {
  if (!isoDate) return null
  const target = Date.parse(`${isoDate}T00:00:00`)
  const start = Date.parse(`${today()}T00:00:00`)
  if (Number.isNaN(target)) return null
  return Math.round((target - start) / 86_400_000)
}

export function dueLabel(isoDate: string): string {
  const days = daysUntil(isoDate)
  if (days === null) return 'No follow-up set'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days === -1) return 'Overdue by 1 day'
  if (days < 0) return `Overdue by ${-days} days`
  return `Due in ${days} days`
}

export function addDays(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00`)
  base.setDate(base.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
}
