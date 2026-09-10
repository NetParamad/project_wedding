'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  min?: string
  className?: string
  mode?: 'single' | 'range'
  valueStart?: string
  valueEnd?: string
  onRangeChange?: (start: string, end: string) => void
  disabledDates?: string[]
  onDisabledDateClick?: (date: string) => void
}

const DAYS_THAI = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

function toISO(d: Date) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

function parseDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00')
}

export function DatePicker({
  value, onChange, min, className,
  mode = 'single', valueStart, valueEnd, onRangeChange,
  disabledDates, onDisabledDateClick,
}: DatePickerProps) {
  const today = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const minDate = useMemo(() => {
    if (min) {
      const d = parseDate(min)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
    return today
  }, [min, today])

  const selectedDate = value ? parseDate(value) : null

  const [viewMonth, setViewMonth] = useState(() => {
    const ref = selectedDate || (mode === 'range' && valueStart ? parseDate(valueStart) : null) || today
    return new Date(ref.getFullYear(), ref.getMonth(), 1)
  })

  const canGoPrev = useMemo(() => {
    const prev = new Date(viewMonth)
    prev.setMonth(prev.getMonth() - 1)
    const monthStart = new Date(prev.getFullYear(), prev.getMonth(), 1)
    const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    return monthStart >= minStart
  }, [viewMonth, minDate])

  const monthTitle = viewMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  const days = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [viewMonth])

  function goToPrevMonth() {
    const prev = new Date(viewMonth)
    prev.setMonth(prev.getMonth() - 1)
    const monthStart = new Date(prev.getFullYear(), prev.getMonth(), 1)
    const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    if (monthStart < minStart) return
    setViewMonth(prev)
  }

  function goToNextMonth() {
    const next = new Date(viewMonth)
    next.setMonth(next.getMonth() + 1)
    setViewMonth(next)
  }

  function isUnavailable(day: number) {
    if (!disabledDates) return false
    const iso = toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
    return disabledDates.includes(iso)
  }

  // While choosing the end of a range, the first unavailable day after the
  // start caps how far the range can reach — you can't book across a blocked day.
  const rangeEndCap = useMemo(() => {
    if (mode !== 'range' || !valueStart || valueEnd || !disabledDates?.length) return null
    const start = parseDate(valueStart)
    const after = disabledDates
      .map(parseDate)
      .filter((d) => d > start)
      .sort((a, b) => a.getTime() - b.getTime())
    return after[0] ?? null
  }, [mode, valueStart, valueEnd, disabledDates])

  function isDisabled(day: number) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    if (d < minDate) return true
    if (mode === 'range' && valueStart && !valueEnd) {
      const start = parseDate(valueStart)
      if (d <= start) return true
      if (rangeEndCap && d >= rangeEndCap) return true
    }
    return false
  }

  function isStartDay(day: number) {
    if (mode !== 'range' || !valueStart) return false
    const d = toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
    return d === valueStart
  }

  function isEndDay(day: number) {
    if (mode !== 'range' || !valueEnd) return false
    const d = toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
    return d === valueEnd
  }

  function isInRange(day: number) {
    if (mode !== 'range' || !valueStart || !valueEnd) return false
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    const start = parseDate(valueStart)
    const end = parseDate(valueEnd)
    return d > start && d < end
  }

  function isSelected(day: number) {
    if (mode === 'range') {
      return isStartDay(day) || isEndDay(day)
    }
    if (!selectedDate) return false
    return selectedDate.getFullYear() === viewMonth.getFullYear() &&
      selectedDate.getMonth() === viewMonth.getMonth() &&
      selectedDate.getDate() === day
  }

  function isToday(day: number) {
    return today.getFullYear() === viewMonth.getFullYear() &&
      today.getMonth() === viewMonth.getMonth() &&
      today.getDate() === day
  }

  function handleSelect(day: number) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    const iso = toISO(d)

    if (mode === 'range') {
      if (!valueStart || (valueStart && valueEnd)) {
        onRangeChange?.(iso, '')
      } else {
        const start = parseDate(valueStart)
        // Reject a range that would span an unavailable day — restart instead.
        const spansBlocked = d > start && (disabledDates ?? []).some((bad) => {
          const b = parseDate(bad)
          return b > start && b <= d
        })
        if (d > start && !spansBlocked) {
          onRangeChange?.(valueStart, iso)
        } else {
          onRangeChange?.(iso, '')
        }
      }
    } else {
      onChange?.(iso)
    }
  }

  const rangeLabel = mode === 'range' && valueStart
    ? valueEnd
      ? `${parseDate(valueStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${parseDate(valueEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : `ตั้งแต่วันที่ ${parseDate(valueStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : null

  return (
    <div className={cn('space-y-2', className)}>
      {rangeLabel && (
        <div className="text-sm text-center font-medium text-primary">
          {rangeLabel}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" onClick={goToPrevMonth} disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthTitle}</span>
        <Button type="button" variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS_THAI.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((day, i) =>
          day ? (
            <Button
              key={i}
              type="button"
              variant={isSelected(day) ? 'default' : isToday(day) ? 'outline' : 'ghost'}
              size="xs"
              disabled={isDisabled(day) || (isUnavailable(day) && !onDisabledDateClick)}
              onClick={() => {
                if (isUnavailable(day) && onDisabledDateClick) {
                  const iso = toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
                  onDisabledDateClick(iso)
                } else {
                  handleSelect(day)
                }
              }}
              className={cn(
                !isSelected(day) && !isToday(day) && 'font-normal',
                isInRange(day) && 'bg-primary/10',
                isUnavailable(day) && 'text-red-400 bg-red-50 line-through',
                isUnavailable(day) && onDisabledDateClick && 'cursor-pointer hover:bg-red-100',
              )}
            >
              {day}
            </Button>
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </div>
  )
}
