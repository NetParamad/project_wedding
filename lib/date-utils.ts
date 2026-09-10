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

/**
 * Number of rental days for a start/end pair.
 *
 * The availability lock (rentals_no_overlap exclusion constraint) and
 * get_product_unavailable_dates both treat the range as inclusive of BOTH
 * ends — the dress is physically unavailable on the start date, the end date,
 * and every day between. Pricing must count the same days, so a same-day
 * rental is 1 day and 3–5 ม.ค. is 3 days.
 *
 * Returns 0 when the dates are missing or end is before start.
 */
export function rentalDayCount(start: string, end: string): number {
  if (!start || !end) return 0
  const ms = parseDate(end).getTime() - parseDate(start).getTime()
  if (Number.isNaN(ms) || ms < 0) return 0
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1
}

export function formatDateThai(dateStr: string): string {
  const d = parseDate(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}
