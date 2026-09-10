export function toISO(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

export function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const current = parseDate(start)
  const last = parseDate(end)
  while (current <= last) {
    dates.push(toISO(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  const d = parseDate(date)
  const s = parseDate(start)
  const e = parseDate(end)
  return d >= s && d <= e
}

export function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart
}

export function formatDateThai(dateStr: string): string {
  const d = parseDate(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}
