'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActiveAppointmentServices, getAppointmentsByDate, getAllActiveProducts, getProductUnavailableDates } from '@/lib/supabase/queries'
import { createAppointmentAction } from '@/app/actions/appointments'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import type { AppointmentService, Product, ProductImage } from '@/lib/db.types'

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <BookAppointmentContent />
    </Suspense>
  )
}

function BookAppointmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectProductSlug = searchParams.get('product')

  const [services, setServices] = useState<AppointmentService[]>([])
  const [products, setProducts] = useState<(Product & { images: ProductImage[] })[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<{ time_slot: string; end_time: string; service_id: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('none')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [disabledDates, setDisabledDates] = useState<string[]>([])

  const selectedService = services.find(s => s.id.toString() === selectedServiceId)
  const selectedProduct = products.find(p => p.id.toString() === selectedProductId)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        const [svc, allProducts] = await Promise.all([
          getActiveAppointmentServices(supabase),
          getAllActiveProducts(supabase),
        ])
        const available = allProducts.filter(p => !p.is_locked)
        setServices(svc)
        setProducts(available)

        if (preselectProductSlug) {
          const matched = available.find(p => p.slug === preselectProductSlug)
          if (matched) {
            setSelectedProductId(matched.id.toString())
            const tryOn = svc.find(s => s.type === 'try_on')
            if (tryOn) setSelectedServiceId(tryOn.id.toString())
            setLoading(false)
            return
          }
        }

        if (svc.length > 0) {
          setSelectedServiceId(svc[0].id.toString())
        }
      } catch (err) {
        console.error('Failed to load booking data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [router, preselectProductSlug])

  useEffect(() => {
    if (!selectedDate) return
    const fetch = async () => {
      const supabase = createClient()
      const slots = await getAppointmentsByDate(supabase, selectedDate)
      setOccupiedSlots(slots)
    }
    fetch()
  }, [selectedDate])

  useEffect(() => {
    if (!selectedProductId || selectedProductId === 'none') return
    const fetch = async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const dates = await getProductUnavailableDates(supabase, parseInt(selectedProductId), today, end, false)
      setDisabledDates(dates)
    }
    fetch()
  }, [selectedProductId])

  function generateTimeSlots(duration: number): string[] {
    const allSlots: string[] = []
    for (let h = 9; h < 18; h++) {
      const slot = `${h.toString().padStart(2, '0')}:00`
      const end = addMinutes(slot, duration)
      if (end <= '18:00') allSlots.push(slot)
    }
    return allSlots
  }

  function isSlotAvailable(slot: string): boolean {
    if (!selectedService) return true
    const slotEnd = addMinutes(slot, selectedService.duration_minutes)
    return !occupiedSlots.some(occ => {
      if (occ.service_id !== selectedService.id) return false
      return timesOverlap(slot, slotEnd, occ.time_slot, occ.end_time)
    })
  }

  function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + mins
    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
  }

  function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
    return a1 < b2 && a2 > b1
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!selectedServiceId) newErrors.service = 'กรุณาเลือกบริการ'
    if (!selectedDate) newErrors.date = 'กรุณาเลือกวันที่'
    if (!selectedTime) newErrors.time = 'กรุณาเลือกเวลา'
    if (!phone || !/^\d{10}$/.test(phone)) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setSubmitting(true)

    try {
      // end_time is derived server-side from the service duration.
      await createAppointmentAction({
        service_id: selectedService!.id,
        product_id: selectedProductId && selectedProductId !== 'none' ? parseInt(selectedProductId) : null,
        appointment_date: selectedDate,
        time_slot: selectedTime,
        phone,
        notes: notes || undefined,
      })

      router.push('/appointments?booked=1')
    } catch (err) {
      const msg = (err as { message?: string })?.message
      if (msg === 'Not authenticated') {
        alert('กรุณาเข้าสู่ระบบก่อน')
        router.push('/auth/login')
      } else {
        console.error(err)
        alert(msg || 'นัดลองชุดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const timeSlots = useMemo(() => {
    if (!selectedService) return []
    return generateTimeSlots(selectedService.duration_minutes)
  }, [selectedService])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/appointments"><ArrowLeft size={18} /></Link>
        </Button>
          <h1 className="text-2xl font-bold">นัดลองชุด</h1>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 text-sm text-blue-800 space-y-1">
          <p>• ค่าบริการ 500 บาท ต่อการนัด 1 ครั้ง</p>
          <p>• เลือกชุดที่อยากลองไว้ล่วงหน้าได้ (จะเลือกหรือไม่ก็ได้)</p>
          <p>• ยกเลิกได้ก่อนถึงวันนัด</p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>เลือกบริการ <span className="text-destructive">*</span></Label>
            <Select value={selectedServiceId} onValueChange={(v) => { setSelectedServiceId(v); setErrors((prev) => ({ ...prev, service: '' })) }}>
              <SelectTrigger aria-invalid={!!errors.service}>
                <SelectValue placeholder="เลือกบริการที่ต้องการ" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service && <p className="text-sm text-destructive">{errors.service}</p>}
          </div>

          {selectedService?.type === 'try_on' && (
            <div className="space-y-2">
              <Label>เลือกชุดที่อยากลอง (จะเลือกหรือไม่ก็ได้)</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกชุด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && selectedProductId !== 'none' && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <div className="w-16 h-16 rounded-md border bg-background overflow-hidden shrink-0">
                    {selectedProduct.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedProduct.images[0].url}
                        alt={selectedProduct.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{selectedProduct.name}</p>
                    {selectedProduct.rental_price > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ราคาเช่า {selectedProduct.rental_price.toLocaleString()} บาท
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>เลือกวันที่ <span className="text-destructive">*</span></Label>
            <DatePicker
              value={selectedDate}
              onChange={(v) => { setSelectedDate(v); setSelectedTime(''); setErrors((prev) => ({ ...prev, date: '' })) }}
              min={new Date().toISOString().split('T')[0]}
              disabledDates={disabledDates}
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <Label>เลือกเวลา <span className="text-destructive">*</span></Label>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">วันที่เลือกไม่มีเวลาว่าง ลองเลือกวันอื่น</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map(slot => {
                    const available = isSlotAvailable(slot)
                    return (
                      <Button
                        key={slot}
                        type="button"
                        disabled={!available}
                        variant="outline"
                        onClick={() => { setSelectedTime(slot); setErrors((prev) => ({ ...prev, time: '' })) }}
                        className={`text-sm ${
                          selectedTime === slot
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground'
                            : !available
                              ? 'bg-muted text-muted-foreground/50 border-muted'
                              : ''
                        }`}
                      >
                        {slot.substring(0, 5)}-{addMinutes(slot, selectedService!.duration_minutes).substring(0, 5)}
                      </Button>
                    )
                  })}
                </div>
              )}
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>
          )}
        </CardContent></Card>

        <Card>
          <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">ข้อมูลติดต่อ</h2>
          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทรศัพท์ <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: '' })) }}
              placeholder="เบอร์โทรศัพท์สำหรับติดต่อ"
              pattern="[0-9]{10}"
              title="กรุณากรอกเบอร์โทร 10 หลัก"
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุถึงร้าน (ถ้ามี)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น สอบถามไซซ์ หรือแจ้งความต้องการพิเศษ"
              rows={3}
            />
          </div>
        </CardContent></Card>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ยืนยันการนัด'}
        </Button>
      </form>
    </div>
  )
}
