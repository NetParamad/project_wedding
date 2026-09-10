'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAppointment, getAllActiveProducts } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle, Pencil, XCircle, Shirt, ClipboardList, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import Link from 'next/link'
import { toast } from 'sonner'
import type { Appointment, AppointmentService, Product, ProductImage } from '@/lib/db.types'

const statusSteps = ['pending', 'confirmed', 'completed']

const aptStatusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

const statusLabel = (s: string) => aptStatusLabels[s] || s

const TIME_SLOTS = Array.from({ length: 9 }, (_, i) =>
  `${(i + 9).toString().padStart(2, '0')}:00`
)

export default function AdminAppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<(Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editProductId, setEditProductId] = useState('none')
  const [editNotes, setEditNotes] = useState('')

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const [rentalOpen, setRentalOpen] = useState(false)
  const [rentalStart, setRentalStart] = useState('')
  const [rentalEnd, setRentalEnd] = useState('')
  const [rentalPrice, setRentalPrice] = useState('0')
  const [rentalDeposit, setRentalDeposit] = useState('0')
  const [rentalErrors, setRentalErrors] = useState<Record<string, string>>({})

  const [tryonOpen, setTryonOpen] = useState(false)
  const [tryonPrice, setTryonPrice] = useState('500')
  const [tryonNotes, setTryonNotes] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAppointment(supabase, Number(params.id))
      if (!data) {
        router.push('/admin/appointments')
        return
      }
      setAppointment(data)
      setEditDate(data.appointment_date)
      setEditTime(data.time_slot?.substring(0, 5) || '09:00')
      setEditProductId(data.product_id?.toString() ?? 'none')
      setEditNotes(data.notes ?? '')
      if (data.product) {
        setRentalPrice(data.product.rental_price.toString())
        setRentalDeposit(data.product.rental_deposit.toString())
      }
      const allProducts = await getAllActiveProducts(supabase)
      const availableProds = allProducts.filter(p => !p.is_locked)
      setProducts(availableProds)
      setLoading(false)
    }
    fetch()
  }, [params.id, router])

  async function handleStatusChange(newStatus: Appointment['status']) {
    if (!appointment) return
    setUpdating(true)
    try {
      const { updateAppointmentStatus, createNotification } = await import('@/lib/supabase/queries')
      const supabase = createClient()
      await updateAppointmentStatus(supabase, appointment.id, { status: newStatus })
      setAppointment({ ...appointment, status: newStatus })

      try {
        await createNotification(supabase, {
          user_id: appointment.user_id,
          type: 'appointment_update',
          title: 'สถานะนัดลองชุดเปลี่ยนแปลง',
          message: `นัดลองชุด #${appointment.id} เปลี่ยนเป็น "${statusLabel(newStatus)}" แล้ว`,
          link: `/appointments/${appointment.id}`,
        })
      } catch {} // best-effort

      if (newStatus === 'cancelled') {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถอัปเดตสถานะได้')
    } finally {
      setUpdating(false)
    }
  }

  async function handleEdit() {
    if (!appointment) return
    setUpdating(true)
    try {
      const { updateAppointmentAdmin, getAppointmentsByDate, isProductAvailableForAppointment } = await import('@/lib/supabase/queries')
      const supabase = createClient()
      const endHour = parseInt(editTime.split(':')[0]) + 1
      const endTime = `${endHour.toString().padStart(2, '0')}:00`

      const occupiedSlots = await getAppointmentsByDate(supabase, editDate)
      const timeConflict = occupiedSlots.some((occ) => {
        if (occ.id === appointment.id) return false
        if (occ.service_id !== appointment.service.id) return false
        return editTime < occ.end_time && endTime > occ.time_slot
      })
      if (timeConflict) {
        toast.error('ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น')
        setUpdating(false)
        return
      }

      const newProductId = editProductId && editProductId !== 'none' ? parseInt(editProductId) : null
      if (newProductId && (newProductId !== appointment.product_id || editDate !== appointment.appointment_date)) {
        const available = await isProductAvailableForAppointment(supabase, newProductId, editDate)
        if (!available) {
          toast.error('สินค้านี้ไม่ว่างในวันที่เลือก')
          setUpdating(false)
          return
        }
      }

      await updateAppointmentAdmin(supabase, appointment.id, {
        appointment_date: editDate,
        time_slot: editTime,
        end_time: endTime,
        product_id: newProductId,
        notes: editNotes || undefined,
      })
      const updated = await getAppointment(supabase, appointment.id)
      if (updated) setAppointment(updated)
      setEditOpen(false)
      toast.success('อัปเดตนัดลองชุดแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถแก้ไขได้')
    } finally {
      setUpdating(false)
    }
  }

  async function handleCancel() {
    if (!appointment) return
    setUpdating(true)
    try {
      const { updateAppointmentStatus } = await import('@/lib/supabase/queries')
      const supabase = createClient()
      await updateAppointmentStatus(supabase, appointment.id, { status: 'cancelled' })
      await supabase
        .from('appointments')
        .update({ admin_notes: cancelReason, updated_at: new Date().toISOString() })
        .eq('id', appointment.id)
      setAppointment({ ...appointment, status: 'cancelled', admin_notes: cancelReason })
      setCancelOpen(false)
      toast.success('ยกเลิกนัดลองชุดแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถยกเลิกได้')
    } finally {
      setUpdating(false)
    }
  }

  async function handleConvertToRental() {
    if (!appointment || !appointment.product) return
    const newErrors: Record<string, string> = {}
    if (!rentalStart) newErrors.rentalStart = 'กรุณาเลือกวันที่เริ่มเช่า'
    if (!rentalEnd) newErrors.rentalEnd = 'กรุณาเลือกวันที่สิ้นสุดเช่า'
    if (Object.keys(newErrors).length > 0) { setRentalErrors(newErrors); return }
    setRentalErrors({})
    setUpdating(true)
    try {
      const { createRental, isProductAvailable } = await import('@/lib/supabase/queries')
      const supabase = createClient()

      // Don't count appointments as conflicts — this rental is being created
      // FROM an appointment, so the fitting date normally overlaps on purpose.
      const available = await isProductAvailable(supabase, appointment.product.id, rentalStart, rentalEnd, false)
      if (!available) {
        toast.error('ไม่สามารถเช่าได้ในช่วงวันที่เลือก เนื่องจากชุดนี้ถูกล็อกหรือมีคนเช่าอยู่')
        setUpdating(false)
        return
      }

      const rental = await createRental(supabase, {
        user_id: appointment.user_id,
        product_id: appointment.product.id,
        appointment_id: appointment.id,
        rental_start_date: rentalStart,
        rental_end_date: rentalEnd,
        rental_price: parseFloat(rentalPrice) || 0,
        deposit_amount: parseFloat(rentalDeposit) || 0,
      })
      await supabase
        .from('appointments')
        .update({ is_rental: true, rental_id: rental.id, updated_at: new Date().toISOString() })
        .eq('id', appointment.id)
      setAppointment({ ...appointment, is_rental: true, rental_id: rental.id })
      setRentalOpen(false)
      toast.success('สร้างรายการเช่าแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถสร้างรายการเช่าได้')
    } finally {
      setUpdating(false)
    }
  }

  async function handleTryOnOnly() {
    if (!appointment) return
    setUpdating(true)
    try {
      const supabase = createClient()
      await supabase
        .from('appointments')
        .update({
          try_on_only: true,
          try_on_price: parseFloat(tryonPrice) || 0,
          admin_notes: tryonNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointment.id)
      setAppointment({ ...appointment, try_on_only: true, try_on_price: parseFloat(tryonPrice) || 0 })
      setTryonOpen(false)
      toast.success('บันทึกลองชุดเท่านั้นแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถบันทึกได้')
    } finally {
      setUpdating(false)
    }
  }

  async function handleNoShow() {
    if (!appointment) return
    if (!window.confirm('บันทึกว่าลูกค้าไม่มาลองชุด และยกเลิกนัดนี้?')) return
    setUpdating(true)
    try {
      const { updateAppointmentStatus } = await import('@/lib/supabase/queries')
      const supabase = createClient()
      await updateAppointmentStatus(supabase, appointment.id, { status: 'cancelled' })
      await supabase
        .from('appointments')
        .update({ admin_notes: 'ไม่มาลองจริง', updated_at: new Date().toISOString() })
        .eq('id', appointment.id)
      setAppointment({ ...appointment, status: 'cancelled', admin_notes: 'ไม่มาลองจริง' })
      toast.success('บันทึกว่าไม่มาลองแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถบันทึกได้')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!appointment) return null

  const isCancelled = appointment.status === 'cancelled'
  const currentStep = statusSteps.indexOf(appointment.status)
  const serviceName = appointment.service?.name || ''
  const productName = appointment.product ? appointment.product.name : null

  const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled']

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/appointments"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">นัดลองชุด #{appointment.id}</h1>
          <p className="text-sm text-muted-foreground">{serviceName}</p>
        </div>
      </div>

      {isCancelled ? (
        <Card className="bg-red-50 border-red-200 text-center text-red-700 font-medium">
          <CardContent className="p-4">
            นัดลองชุดนี้ถูกยกเลิกแล้ว
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
                {statusLabel(step)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Status update */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">อัปเดตสถานะ</span>
        <Select value={appointment.status} onValueChange={handleStatusChange} disabled={updating}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {updating && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {/* Action buttons */}
      {!isCancelled && (
        <div className="flex flex-wrap gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Pencil size={14} className="mr-1" />แก้ไข</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>แก้ไขนัดลองชุด</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>วันที่</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>เวลา</Label>
                  <Select value={editTime} onValueChange={setEditTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ชุดแต่งงาน</Label>
                  <Select value={editProductId} onValueChange={setEditProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกชุด" />
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
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleEdit} disabled={updating} className="w-full">
                  {updating ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm"><XCircle size={14} className="mr-1" />ยกเลิก</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ยกเลิกนัดลองชุด</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>เหตุผลที่ยกเลิก</Label>
                  <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="ระบุเหตุผล..." />
                </div>
                <Button variant="destructive" onClick={handleCancel} disabled={updating} className="w-full">
                  {updating ? 'กำลังยกเลิก...' : 'ยืนยันการยกเลิก'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {appointment.product && (
            <Dialog open={rentalOpen} onOpenChange={setRentalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Shirt size={14} className="mr-1" />เช่าต่อ</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เช่าต่อจากลองชุด</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-muted">
                        {appointment.product.images.length > 0 ? (
                          <img
                            src={appointment.product.images.find(i => i.is_primary)?.url ?? appointment.product.images[0].url}
                            alt={appointment.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shirt size={16} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium">{appointment.product.name}</p>
                    </div>
                    <div className="text-muted-foreground grid grid-cols-2 gap-1">
                      <span>ราคาเช่า: ฿{Number(appointment.product.rental_price).toLocaleString()}</span>
                      <span>ค่าประกัน: ฿{Number(appointment.product.rental_deposit).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>วันที่เริ่มเช่า <span className="text-destructive">*</span></Label>
                      <Input type="date" value={rentalStart} onChange={(e) => { setRentalStart(e.target.value); setRentalErrors(p => ({ ...p, rentalStart: '' })) }} aria-invalid={!!rentalErrors.rentalStart} />
                      {rentalErrors.rentalStart && <p className="text-sm text-destructive">{rentalErrors.rentalStart}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>วันที่สิ้นสุดเช่า <span className="text-destructive">*</span></Label>
                      <Input type="date" value={rentalEnd} onChange={(e) => { setRentalEnd(e.target.value); setRentalErrors(p => ({ ...p, rentalEnd: '' })) }} aria-invalid={!!rentalErrors.rentalEnd} />
                      {rentalErrors.rentalEnd && <p className="text-sm text-destructive">{rentalErrors.rentalEnd}</p>}
                    </div>
                  </div>
                  {rentalStart && rentalEnd && (
                    <div className="text-sm text-muted-foreground">
                      จำนวนวัน: {Math.max(0, Math.ceil((new Date(rentalEnd).getTime() - new Date(rentalStart).getTime()) / (1000 * 60 * 60 * 24)))} วัน
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ราคาเช่า (บาท)</Label>
                      <Input type="number" min="0" value={rentalPrice} onChange={(e) => setRentalPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>ค่าประกัน (บาท)</Label>
                      <Input type="number" min="0" value={rentalDeposit} onChange={(e) => setRentalDeposit(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleConvertToRental} disabled={updating} className="w-full">
                    {updating ? 'กำลังสร้าง...' : 'สร้างรายการเช่า'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={tryonOpen} onOpenChange={setTryonOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><ClipboardList size={14} className="mr-1" />ลองชุดเท่านั้น</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ลองชุดเท่านั้น (ไม่เช่า)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ราคาลองชุด (บาท)</Label>
                  <Input type="number" min="0" value={tryonPrice} onChange={(e) => setTryonPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea value={tryonNotes} onChange={(e) => setTryonNotes(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleTryOnOnly} disabled={updating} className="w-full">
                  {updating ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="secondary" size="sm" onClick={handleNoShow} disabled={updating}>
            <Ban size={14} className="mr-1" />ไม่มาลอง
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
        <h2 className="font-semibold">รายละเอียดนัดลองชุด</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground">บริการ</span>
            <p className="font-medium">{serviceName}</p>
          </div>
          {productName && (
            <div>
              <span className="text-muted-foreground">สินค้า</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {appointment.product && appointment.product.images.length > 0 ? (
                    <img
                      src={appointment.product.images.find(i => i.is_primary)?.url ?? appointment.product.images[0].url}
                      alt={productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt size={18} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="font-medium">{productName}</p>
              </div>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">ลูกค้า</span>
            <p className="font-medium">{appointment.phone || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">วันที่</span>
            <p className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString('th-TH')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">เวลา</span>
            <p className="font-medium">{appointment.time_slot?.substring(0, 5)}</p>
          </div>
          {appointment.phone && (
            <div>
              <span className="text-muted-foreground">เบอร์โทร</span>
              <p className="font-medium">{appointment.phone}</p>
            </div>
          )}
          {appointment.is_rental && (
            <div>
              <span className="text-muted-foreground">เช่าชุด</span>
              <p className="font-medium text-green-600">ใช่</p>
            </div>
          )}
          {appointment.try_on_only && (
            <div>
              <span className="text-muted-foreground">ลองชุดเท่านั้น</span>
              <p className="font-medium text-blue-600">ใช่ (฿{Number(appointment.try_on_price).toLocaleString()})</p>
            </div>
          )}
        </div>
      </CardContent></Card>

      {appointment.notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">หมายเหตุ</h2>
          <p className="text-muted-foreground">{appointment.notes}</p>
        </CardContent></Card>
      )}

      {appointment.admin_notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">หมายเหตุ (Admin)</h2>
          <p className="text-muted-foreground">{appointment.admin_notes}</p>
        </CardContent></Card>
      )}
    </div>
  )
}
