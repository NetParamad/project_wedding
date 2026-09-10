'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRentalsByProductInRange } from '@/lib/supabase/queries'
import { generateDateRange, formatDateThai } from '@/lib/date-utils'
import type { ProductDateLock } from '@/lib/db.types'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Lock, Package } from 'lucide-react'

interface AvailabilityDetail {
  type: 'lock' | 'rental'
  description: string
}

interface Props {
  productId: number
  initialLocks: ProductDateLock[]
}

export function AvailabilityCalendar({ productId, initialLocks }: Props) {
  const [disabledDates, setDisabledDates] = useState<string[]>([])
  const [datesDetails, setDatesDetails] = useState<Record<string, AvailabilityDetail[]>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState<AvailabilityDetail[]>([])

  const buildData = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const end = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const detailsMap: Record<string, AvailabilityDetail[]> = {}

    for (const lock of initialLocks) {
      const dates = generateDateRange(lock.lock_start_date, lock.lock_end_date)
      const desc = lock.reason
        ? `ล็อคโดย admin: ${lock.reason}`
        : `ล็อคโดย admin (${formatDateThai(lock.lock_start_date)} → ${formatDateThai(lock.lock_end_date)})`
      for (const d of dates) {
        if (!detailsMap[d]) detailsMap[d] = []
        detailsMap[d].push({ type: 'lock', description: desc })
      }
    }

    try {
      const rentals = await getRentalsByProductInRange(supabase, productId, today, end)
      for (const rental of rentals) {
        const dates = generateDateRange(rental.rental_start_date, rental.rental_end_date)
        const name = rental.customer_name || 'ไม่ระบุชื่อ'
        const desc = `📦 เช่าโดย ${name} (${formatDateThai(rental.rental_start_date)} → ${formatDateThai(rental.rental_end_date)})`
        for (const d of dates) {
          if (!detailsMap[d]) detailsMap[d] = []
          detailsMap[d].push({ type: 'rental', description: desc })
        }
      }
    } catch (err) {
      console.error('Failed to fetch rentals for calendar:', err)
    }

    setDatesDetails(detailsMap)
    setDisabledDates(Object.keys(detailsMap))
  }, [productId, initialLocks])

  useEffect(() => {
    buildData()
  }, [buildData])

  function handleDateClick(date: string) {
    const details = datesDetails[date]
    if (details) {
      setSelectedDetails(details)
      setDialogOpen(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>ปฏิทินวันว่าง/ไม่ว่าง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DatePicker
            mode="single"
            disabledDates={disabledDates}
            onDisabledDateClick={handleDateClick}
            min={new Date().toISOString().split('T')[0]}
          />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-red-50 border border-red-200" />
              <span>ไม่ว่าง</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-background border" />
              <span>ว่าง</span>
            </div>
            <div className="text-xs">(กดวันที่แดงเพื่อดูรายละเอียด)</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รายละเอียดวันที่ไม่ว่าง</DialogTitle>
            <DialogDescription>
              {selectedDetails.length} รายการที่ไม่ว่าง
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDetails.map((detail, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="mt-0.5">
                  {detail.type === 'lock' ? (
                    <Lock className="h-4 w-4 text-red-500" />
                  ) : (
                    <Package className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <p className="text-sm">{detail.description}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            ปิด
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
