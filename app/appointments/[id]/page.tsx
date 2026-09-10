'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAppointment, updateAppointmentCustomer, getAllActiveProducts, getAppointmentsByDate, isProductAvailableForAppointment } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle, Pencil, FileText, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import type { Appointment, AppointmentService, Product, ProductImage } from '@/lib/db.types'

const statusSteps = ['pending', 'confirmed', 'completed']

const statusLabels: Record<string, string> = {
  pending: 'รอร้านยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิกแล้ว',
}

function formatDateThai(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AppointmentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AppointmentDetailContent />
    </Suspense>
  )
}

function AppointmentDetailContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [appointment, setAppointment] = useState<(Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<{ time_slot: string; end_time: string; service_id: number }[]>([])

  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editProductId, setEditProductId] = useState('none')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?redirect=/appointments')
          return
        }
        const data = await getAppointment(supabase, Number(params.id))
        if (!data || data.user_id !== user.id) {
          router.push('/appointments')
          return
        }
        setAppointment(data)

        const allProducts = await getAllActiveProducts(supabase)
        const available = allProducts.filter(p => !p.is_locked)
        setProducts(available)
      } catch (err) {
        console.error('Failed to load appointment:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [router, params.id])

  useEffect(() => {
    if (!editDate) return
    const fetch = async () => {
      const supabase = createClient()
      const slots = await getAppointmentsByDate(supabase, editDate)
      setOccupiedSlots(slots)
    }
    fetch()
  }, [editDate])

  function openEditDialog() {
    if (!appointment) return
    setEditDate(appointment.appointment_date)
    setEditTime(appointment.time_slot)
    setEditProductId(appointment.product_id?.toString() ?? 'none')
    setEditNotes(appointment.notes ?? '')
    setEditing(true)
  }

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
    if (!appointment) return true
    const slotEnd = addMinutes(slot, appointment.service.duration_minutes)
    return !occupiedSlots.some(occ => {
      if (occ.service_id !== appointment.service.id) return false
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

  async function handleSaveEdit() {
    if (!appointment) return
    const newErrors: Record<string, string> = {}
    if (!editDate) newErrors.editDate = 'กรุณาเลือกวันที่'
    if (!editTime) newErrors.editTime = 'กรุณาเลือกเวลา'
    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return }
    setEditErrors({})
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const endTime = addMinutes(editTime, appointment.service.duration_minutes)

      const newProductId = editProductId && editProductId !== 'none' ? parseInt(editProductId) : null
      if (newProductId && (newProductId !== appointment.product_id || editDate !== appointment.appointment_date)) {
        const available = await isProductAvailableForAppointment(supabase, newProductId, editDate)
        if (!available) {
          alert('สินค้านี้ไม่ว่างในวันที่เลือก')
          setSaving(false)
          return
        }
      }

      await updateAppointmentCustomer(supabase, appointment.id, user.id, {
        appointment_date: editDate,
        time_slot: editTime,
        end_time: endTime,
        product_id: newProductId,
        notes: editNotes || undefined,
      })

      const refreshed = await getAppointment(supabase, appointment.id)
      if (refreshed) setAppointment(refreshed)
      setEditing(false)
    } catch (err) {
      console.error(err)
      alert('แก้ไขวันนัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  const timeSlots = useMemo(() => {
    if (!appointment?.service) return []
    return generateTimeSlots(appointment.service.duration_minutes)
  }, [appointment?.service])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!appointment) return null

  const isCancelled = appointment.status === 'cancelled'
  const isPending = appointment.status === 'pending'
  const currentStep = statusSteps.indexOf(appointment.status)
  const serviceName = appointment.service?.name || ''
  const productName = appointment.product ? appointment.product.name : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={searchParams.get('from') === 'admin' ? '/admin/appointments' : '/appointments'}>
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">รายละเอียดการนัดลองชุด</h1>
          <p className="text-sm text-muted-foreground">
            #{appointment.id} &middot; {formatDateThai(appointment.appointment_date)} {appointment.time_slot?.substring(0, 5)} &middot; {serviceName}
          </p>
        </div>
      </div>

      {isCancelled ? (
        <Card className="bg-red-50 border-red-200 text-center text-red-700 font-medium">
          <CardContent className="p-4">
การนัดลองชุดนี้ถูกยกเลิกแล้ว
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {statusSteps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              {idx < currentStep ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : idx === currentStep ? (
                <Circle className="w-5 h-5 text-primary shrink-0" fill="currentColor" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
              )}
              <span className={idx <= currentStep ? 'font-medium' : 'text-muted-foreground'}>
                {statusLabels[step]}
              </span>
            </div>
          ))}
        </div>
      )}

      {isPending && (
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-muted-foreground"><FileText size={14} className="inline mr-1" />แก้ไขวันและเวลานัดได้ จนกว่าทางร้านจะยืนยัน</p>
          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Pencil size={14} className="mr-1" /> แก้ไขวันนัด
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>แก้ไขวันนัด</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>วันที่</Label>
                  <DatePicker
                    value={editDate}
                    onChange={(v) => { setEditDate(v); setEditTime(''); setEditErrors((prev) => ({ ...prev, editDate: '' })) }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {editErrors.editDate && <p className="text-sm text-destructive">{editErrors.editDate}</p>}
                </div>

                {editDate && (
                  <div className="space-y-2">
                    <Label>เวลา</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map(slot => {
                        const available = isSlotAvailable(slot)
                        return (
                          <Button key={slot} type="button" disabled={!available} variant="outline"
                            onClick={() => { setEditTime(slot); setEditErrors((prev) => ({ ...prev, editTime: '' })) }}
                            className={`text-sm ${editTime === slot ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' : !available ? 'bg-muted text-muted-foreground/50 border-muted' : ''}`}>
                            {slot.substring(0, 5)}-{addMinutes(slot, appointment!.service.duration_minutes).substring(0, 5)}
                          </Button>
                        )
                      })}
                    </div>
                    {editErrors.editTime && <p className="text-sm text-destructive">{editErrors.editTime}</p>}
                  </div>
                )}

                {appointment.service?.type === 'try_on' && (
                  <div className="space-y-2">
                    <Label>สินค้า</Label>
                    <Select value={editProductId} onValueChange={setEditProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name} {p.is_locked ? '(ล็อค)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
                </div>

                <Button onClick={handleSaveEdit} disabled={saving || !editDate || !editTime} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'บันทึก'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
        <h2 className="font-semibold">รายละเอียดการนัดลองชุด</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground">บริการ</span>
            <p className="font-medium">{serviceName}</p>
          </div>
          {productName && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">สินค้า</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {appointment.product && appointment.product.images.length > 0 ? (
                    <img
                      src={appointment.product.images.find(i => i.is_primary)?.url ?? appointment.product.images[0].url}
                      alt={productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={22} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="font-medium">{productName}</p>
              </div>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">วันที่</span>
            <p className="font-medium">{formatDateThai(appointment.appointment_date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">เวลา</span>
            <p className="font-medium">{appointment.time_slot?.substring(0, 5)}</p>
          </div>
          {appointment.phone && (
            <div>
              <span className="text-muted-foreground">เบอร์โทรศัพท์</span>
              <p className="font-medium">{appointment.phone}</p>
            </div>
          )}
          {appointment.admin_notes && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">หมายเหตุจากร้านค้า</span>
              <p className="font-medium text-amber-700">{appointment.admin_notes}</p>
            </div>
          )}
        </div>
      </CardContent></Card>

      {appointment.notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">หมายเหตุของคุณ</h2>
          <p className="text-muted-foreground">{appointment.notes}</p>
        </CardContent></Card>
      )}
    </div>
  )
}
