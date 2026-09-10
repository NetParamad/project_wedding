'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAdminRental, updateRentalStatus, updateRentalReturn, updateRental } from '@/lib/supabase/queries'
import { rentalDayCount } from '@/lib/date-utils'
import { Loader2, ArrowLeft, ShoppingBagIcon, ImageIcon } from 'lucide-react'
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
} from '@/components/ui/dialog'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Rental, Product, Profile, ProductImage } from '@/lib/db.types'

const rentalStatusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  active: 'กำลังเช่า',
  returned: 'คืนแล้ว',
  late: 'เกินกำหนด',
  cancelled: 'ยกเลิก',
}

export default function AdminRentalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [rental, setRental] = useState<(Rental & { product: Product & { images: ProductImage[] } }) | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [notes, setNotes] = useState('')

  const [returnOpen, setReturnOpen] = useState(false)
  const [returnDate, setReturnDate] = useState('')
  const [returnCondition, setReturnCondition] = useState('good')
  const [returnPenalty, setReturnPenalty] = useState('0')
  const [returnNotes, setReturnNotes] = useState('')
  const [returnErrors, setReturnErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAdminRental(supabase, Number(params.id))
      if (!data) {
        router.push('/admin/rentals')
        return
      }
      setRental(data)
      if (data.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .maybeSingle()
        if (profileData) setProfile(profileData)
      }
      setStatus(data.status)
      setStartDate(data.rental_start_date)
      setEndDate(data.rental_end_date)
      setPrice(data.rental_price.toString())
      setDeposit(data.deposit_amount.toString())
      setNotes(data.notes ?? '')
      setLoading(false)
    }
    fetch()
  }, [params.id, router])

  async function handleUpdateRental() {
    if (!rental) return
    setUpdating(true)
    try {
      const supabase = createClient()
      await updateRental(supabase, rental.id, {
        rental_start_date: startDate,
        rental_end_date: endDate,
        rental_price: parseFloat(price) || 0,
        deposit_amount: parseFloat(deposit) || 0,
        notes: notes || undefined,
      })
      if (status !== rental.status) {
        await updateRentalStatus(supabase, rental.id, status as Rental['status'])
      }
      const updated = await getAdminRental(supabase, rental.id)
      if (updated) setRental(updated)
      toast.success('อัปเดตรายการเช่าแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setUpdating(false)
    }
  }

  async function handleReturn() {
    if (!rental) return
    const newErrors: Record<string, string> = {}
    if (!returnDate) newErrors.returnDate = 'กรุณาเลือกวันที่คืนจริง'
    if (Object.keys(newErrors).length > 0) { setReturnErrors(newErrors); return }
    setReturnErrors({})
    setUpdating(true)
    try {
      const supabase = createClient()
      await updateRentalReturn(supabase, rental.id, {
        status: 'returned',
        returned_at: new Date(returnDate + 'T' + new Date().toTimeString().substring(0, 5)).toISOString(),
        return_condition: returnCondition,
        return_penalty: parseFloat(returnPenalty) || 0,
        return_notes: returnNotes || undefined,
      })
      const updated = await getAdminRental(supabase, rental.id)
      if (updated) setRental(updated)
      setReturnOpen(false)
      toast.success('บันทึกการคืนชุดแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setUpdating(false)
    }
  }

  async function handleCancelRental() {
    if (!rental) return
    if (!window.confirm(`ยกเลิกรายการเช่า #${rental.id}?`)) return
    setUpdating(true)
    try {
      const supabase = createClient()
      await updateRentalStatus(supabase, rental.id, 'cancelled')
      const updated = await getAdminRental(supabase, rental.id)
      if (updated) setRental(updated)
      toast.success('ยกเลิกรายการเช่าแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
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

  if (!rental) return null

  const isReturned = rental.status === 'returned'
  const isCancelled = rental.status === 'cancelled'
  const isActive = rental.status === 'active'
  const rentalDays = rentalDayCount(rental.rental_start_date, rental.rental_end_date)

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/rentals"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">รายการเช่า #{rental.id}</h1>
          <p className="text-sm text-muted-foreground">{rental.product?.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">ข้อมูลการเช่า</h2>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
              isReturned ? 'bg-green-100 text-green-700' :
              isCancelled ? 'bg-red-100 text-red-700' :
              rental.status === 'late' ? 'bg-red-100 text-red-700' :
              isActive ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {rentalStatusLabels[rental.status] || rental.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">ลูกค้า</span>
              <p className="font-medium">{profile?.display_name || profile?.phone || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ชุด</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {rental.product?.images?.length ? (
                    <img
                      src={rental.product.images.find(i => i.is_primary)?.url ?? rental.product.images[0].url}
                      alt={rental.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={18} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="font-medium">{rental.product?.name || `#${rental.product_id}`}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">วันที่เริ่มเช่า</span>
              <p className="font-medium">{new Date(rental.rental_start_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <span className="text-muted-foreground">วันที่สิ้นสุดเช่า</span>
              <p className="font-medium">{new Date(rental.rental_end_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ราคาเช่า</span>
              <p className="font-medium">
                ฿{Number(rental.rental_price).toLocaleString()}/วัน &times; {rentalDays} วัน = ฿{(Number(rental.rental_price) * rentalDays).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">ค่าประกัน</span>
              <p className="font-medium">฿{Number(rental.deposit_amount).toLocaleString()}</p>
            </div>
            {rental.returned_at && (
              <div className="col-span-2">
                <span className="text-muted-foreground">คืนเมื่อ</span>
                <p className="font-medium text-green-600">
                  {new Date(rental.returned_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {rental.return_condition && (
              <div>
                <span className="text-muted-foreground">สภาพชุด</span>
                <p className="font-medium">{rental.return_condition === 'good' ? 'ดี ไม่มีรอยเสียหาย' : rental.return_condition === 'minor' ? 'มีรอยเล็กน้อย' : 'เสียหาย / ชำรุด'}</p>
              </div>
            )}
            {Number(rental.return_penalty) > 0 && (
              <div>
                <span className="text-muted-foreground">ค่าปรับ</span>
                <p className="font-medium text-red-600">฿{Number(rental.return_penalty).toLocaleString()}</p>
              </div>
            )}
            {rental.return_notes && (
              <div className="col-span-2">
                <span className="text-muted-foreground">หมายเหตุการคืน</span>
                <p className="font-medium">{rental.return_notes}</p>
              </div>
            )}
            {rental.notes && !rental.return_notes && (
              <div className="col-span-2">
                <span className="text-muted-foreground">หมายเหตุ</span>
                <p className="font-medium">{rental.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isCancelled && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">จัดการรายการเช่า</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="active">กำลังเช่า</SelectItem>
                    <SelectItem value="late">เกินกำหนด</SelectItem>
                    <SelectItem value="returned">คืนแล้ว</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>วันที่เริ่มเช่า</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>วันที่สิ้นสุดเช่า</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ราคาเช่า (บาท/วัน)</Label>
                <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ค่าประกัน (บาท)</Label>
                <Input type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleUpdateRental} disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {updating ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </Button>

              {isActive && (
                <Button variant="outline" onClick={() => {
                  setReturnDate(new Date().toISOString().split('T')[0])
                  setReturnCondition('good')
                  setReturnPenalty('0')
                  setReturnNotes('')
                  setReturnOpen(true)
                }}>
                  <ShoppingBagIcon size={14} className="mr-1" /> คืนชุด
                </Button>
              )}

              {!isReturned && (
                <Button variant="destructive" size="sm" onClick={handleCancelRental} disabled={updating}>
                  ยกเลิกรายการเช่า
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกการคืนชุด</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>วันที่คืนจริง <span className="text-destructive">*</span></Label>
              <Input type="date" value={returnDate} onChange={(e) => { setReturnDate(e.target.value); setReturnErrors((prev) => ({ ...prev, returnDate: '' })) }} required aria-invalid={!!returnErrors.returnDate} />
              {returnErrors.returnDate && <p className="text-sm text-destructive">{returnErrors.returnDate}</p>}
            </div>
            <div className="space-y-2">
              <Label>สภาพชุด</Label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">ดี ไม่มีรอยเสียหาย</SelectItem>
                  <SelectItem value="minor">มีรอยเล็กน้อย</SelectItem>
                  <SelectItem value="damaged">เสียหาย / ชำรุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ค่าปรับ (บาท)</Label>
              <Input type="number" min="0" value={returnPenalty} onChange={(e) => setReturnPenalty(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุการคืน</Label>
              <Textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม..." />
            </div>
            <Button onClick={handleReturn} disabled={updating || !returnDate} className="w-full">
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ยืนยันการคืนชุด'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
