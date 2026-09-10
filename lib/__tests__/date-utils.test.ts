import { describe, it, expect } from 'vitest'
import {
  toISO,
  parseDate,
  generateDateRange,
  isDateInRange,
  datesOverlap,
  formatDateThai,
} from '@/lib/date-utils'

describe('toISO', () => {
  it('formats date to YYYY-MM-DD with zero padding', () => {
    expect(toISO(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  it('formats date without padding for double digits', () => {
    expect(toISO(new Date(2024, 11, 25))).toBe('2024-12-25')
  })
})

describe('parseDate', () => {
  it('parses YYYY-MM-DD to local date', () => {
    const d = parseDate('2024-06-15')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(15)
  })
})

describe('generateDateRange', () => {
  it('generates single-day range', () => {
    expect(generateDateRange('2024-06-10', '2024-06-10')).toEqual(['2024-06-10'])
  })

  it('generates multi-day range inclusive of both ends', () => {
    expect(generateDateRange('2024-06-10', '2024-06-13')).toEqual([
      '2024-06-10',
      '2024-06-11',
      '2024-06-12',
      '2024-06-13',
    ])
  })

  it('generates range across month boundary', () => {
    expect(generateDateRange('2024-06-30', '2024-07-02')).toEqual([
      '2024-06-30',
      '2024-07-01',
      '2024-07-02',
    ])
  })

  it('returns empty when end is before start', () => {
    expect(generateDateRange('2024-06-13', '2024-06-10')).toEqual([])
  })
})

describe('isDateInRange', () => {
  const start = '2024-06-10'
  const end = '2024-06-15'

  it('returns true for date inside range', () => {
    expect(isDateInRange('2024-06-12', start, end)).toBe(true)
  })

  it('returns true for start boundary', () => {
    expect(isDateInRange(start, start, end)).toBe(true)
  })

  it('returns true for end boundary', () => {
    expect(isDateInRange(end, start, end)).toBe(true)
  })

  it('returns false for date before range', () => {
    expect(isDateInRange('2024-06-09', start, end)).toBe(false)
  })

  it('returns false for date after range', () => {
    expect(isDateInRange('2024-06-16', start, end)).toBe(false)
  })
})

describe('datesOverlap', () => {
  it('returns true when ranges fully overlap', () => {
    expect(datesOverlap('2024-06-10', '2024-06-15', '2024-06-12', '2024-06-13')).toBe(true)
  })

  it('returns true when ranges partially overlap', () => {
    expect(datesOverlap('2024-06-10', '2024-06-15', '2024-06-14', '2024-06-20')).toBe(true)
  })

  it('returns true when touching at same boundary date', () => {
    expect(datesOverlap('2024-06-10', '2024-06-15', '2024-06-15', '2024-06-20')).toBe(true)
  })

  it('returns false when ranges are disjoint', () => {
    expect(datesOverlap('2024-06-10', '2024-06-15', '2024-06-16', '2024-06-20')).toBe(false)
  })

  it('returns false when one range fully contains the other in reverse order', () => {
    expect(datesOverlap('2024-06-16', '2024-06-20', '2024-06-10', '2024-06-15')).toBe(false)
  })
})

describe('formatDateThai', () => {
  it('formats a date in Thai locale with short month', () => {
    const formatted = formatDateThai('2024-06-10')
    expect(formatted).toContain('10')
    expect(formatted).toContain('2567')
  })
})
