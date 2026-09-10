'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllActiveProducts, getProductUnavailableDates } from '@/lib/supabase/queries'
import { createRentalAction } from '@/app/actions/rentals'
import { rentalDayCount } from '@/lib/date-utils'
import { Loader2, ArrowLeft, ClipboardList, Wallet } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import type { Product, ProductImage } from '@/lib/db.types'

export default function NewRentalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewRentalContent />
    </Suspense>
  )
}

function NewRentalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectProductSlug = searchParams.get('product')

  const [products, setProducts] = useState<(Product & { images: ProductImage[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [selectedProductId, setSelectedProductId] = useState('')
  const [rentalStart, setRentalStart] = useState('')
  const [rentalEnd, setRentalEnd] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryName, setDeliveryName] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [disabledDates, setDisabledDates] = useState<string[]>([])

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
        const allProducts = await getAllActiveProducts(supabase)
        const available = allProducts.filter(p => !p.is_locked)
        setProducts(available)

        if (preselectProductSlug) {
          const matched = available.find(p => p.slug === preselectProductSlug)
          if (matched) {
            setSelectedProductId(matched.id.toString())
            setLoading(false)
            return
          }
        }

        if (available.length > 0) {
          setSelectedProductId(available[0].id.toString())
        }
      } catch (err) {
        console.error('Failed to load rental data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [router, preselectProductSlug])

  useEffect(() => {
    if (!selectedProductId) return
    const fetch = async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const dates = await getProductUnavailableDates(supabase, parseInt(selectedProductId), today, end, true)
      setDisabledDates(dates)
    }
    fetch()
  }, [selectedProductId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
      if (!selectedProductId) newErrors.product = 'กรุณาเลือกสินค้า'
      if (!selectedProduct) newErrors.product = 'กรุณาเลือกสินค้า'
      if (!rentalStart) newErrors.rentalStart = 'กรุณาเลือกวันที่เริ่มเช่า'
      if (!rentalEnd) newErrors.rentalEnd = 'กรุณาเลือกวันที่สิ้นสุดเช่า'
      if (!phone || !/^\d{10}$/.test(phone)) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'
      if (rentalStart && rentalEnd && new Date(rentalEnd) < new Date(rentalStart)) newErrors.rentalEnd = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น'
      if (deliveryMethod === 'delivery') {
        if (!deliveryName.trim()) newErrors.deliveryName = 'กรุณากรอกชื่อผู้รับ'
        if (!deliveryAddress.trim()) newErrors.deliveryAddress = 'กรุณากรอกที่อยู่จัดส่ง'
      }
      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
      setErrors({})
      setSubmitting(true)

      try {
        const result = await createRentalAction({
          product_id: selectedProduct!.id,
          rental_start_date: rentalStart,
          rental_end_date: rentalEnd,
          rental_price: Number(selectedProduct!.rental_price),
          deposit_amount: Number(selectedProduct!.rental_deposit),
          phone,
          notes: notes || undefined,
          product_name: selectedProduct!.name,
          delivery_name: deliveryMethod === 'delivery' ? deliveryName.trim() : undefined,
          delivery_address: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
        })

        router.push(`/rentals/${result.rentalId}`)
      } catch (err) {
        const msg = typeof err === 'string' ? err : (err as { message?: string })?.message || ''
        if (msg === 'Not authenticated') {
          alert('กรุณาเข้าสู่ระบบก่อน')
          router.push('/auth/login')
        } else {
          console.error('Rental create error:', err)
          setErrorMsg(msg || 'ไม่สามารถสร้างคำขอเช่าได้')
        }
      } finally {
        setSubmitting(false)
      }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const days = rentalDayCount(rentalStart, rentalEnd)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/rentals"><ArrowLeft size={18} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">เช่าชุด</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-800 space-y-1">
            <p>• เช่าชุดได้ตั้งแต่วันที่ต้องการ จำนวนวันเช่าสูงสุด 30 วัน</p>
            <p>• ค่าประกันจะคืนเมื่อคืนชุดในสภาพดี</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>เลือกสินค้า <span className="text-destructive">*</span></Label>
            <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setRentalStart(''); setRentalEnd(''); setErrors((prev) => ({ ...prev, product: '' })) }}>
              <SelectTrigger aria-invalid={!!errors.product}>
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product && <p className="text-sm text-destructive">{errors.product}</p>}
          </div>

          {selectedProduct && (
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
              <div className="min-w-0 text-sm">
                <p className="font-medium truncate">{selectedProduct.name}</p>
                <p className="text-muted-foreground">
                  ฿{Number(selectedProduct.rental_price).toLocaleString()} /วัน
                </p>
              </div>
            </div>
          )}

          {selectedProduct && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <p className="font-medium"><ClipboardList size={16} className="inline mr-1" />ข้อมูลสินค้า</p>
              <div className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                <span>ราคาเช่า: <b className="text-foreground">฿{Number(selectedProduct.rental_price).toLocaleString()}</b></span>
                <span>ค่าประกัน: <b className="text-foreground">฿{Number(selectedProduct.rental_deposit).toLocaleString()}</b></span>
              </div>
            </div>
          )}

          {selectedProduct && (
            <div className="space-y-1">
              <Label>เลือกวันที่เช่า <span className="text-destructive">*</span></Label>
              <DatePicker
                mode="range"
                valueStart={rentalStart}
                valueEnd={rentalEnd}
                onRangeChange={(start, end) => {
                  setRentalStart(start);
                  setRentalEnd(end);
                  setErrors((prev) => ({ ...prev, startDate: '', endDate: '' }));
                }}
                min={new Date().toISOString().split('T')[0]}
                disabledDates={disabledDates}
              />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
            </div>
          )}

          {selectedProduct && rentalStart && rentalEnd && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-1.5 text-sm">
              <p className="font-medium text-purple-800"><Wallet size={16} className="inline mr-1" />สรุปค่าใช้จ่าย</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-purple-700">
                <span>จำนวนวัน: {days} วัน</span>
                <span>ราคาเช่า: ฿{Number(selectedProduct.rental_price).toLocaleString()} /วัน</span>
                <span>ค่าประกัน: ฿{Number(selectedProduct.rental_deposit).toLocaleString()}</span>
                <span className="font-semibold text-purple-900">รวมทั้งสิ้น: ฿{(Number(selectedProduct.rental_price) * days + Number(selectedProduct.rental_deposit)).toLocaleString()}</span>
              </div>
              <p className="text-xs text-purple-500 mt-1">* ค่าประกันจะคืนเมื่อคืนชุดในสภาพดี</p>
            </div>
          )}
        </CardContent></Card>

        <Card>
          <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">วิธีการรับชุด</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
              onClick={() => setDeliveryMethod('pickup')}
              className="flex-1"
            >
              มารับเอง
            </Button>
            <Button
              type="button"
              variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
              onClick={() => setDeliveryMethod('delivery')}
              className="flex-1"
            >
              ให้ส่ง
            </Button>
          </div>

          {deliveryMethod === 'delivery' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="deliveryName">ชื่อผู้รับ <span className="text-destructive">*</span></Label>
                <Input
                  id="deliveryName"
                  value={deliveryName}
                  onChange={(e) => { setDeliveryName(e.target.value); setErrors((prev) => ({ ...prev, deliveryName: '' })) }}
                  placeholder="ชื่อ-นามสกุล"
                  aria-invalid={!!errors.deliveryName}
                />
                {errors.deliveryName && <p className="text-sm text-destructive">{errors.deliveryName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">ที่อยู่จัดส่ง <span className="text-destructive">*</span></Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => { setDeliveryAddress(e.target.value); setErrors((prev) => ({ ...prev, deliveryAddress: '' })) }}
                  placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  rows={4}
                  aria-invalid={!!errors.deliveryAddress}
                />
                {errors.deliveryAddress && <p className="text-sm text-destructive">{errors.deliveryAddress}</p>}
              </div>
            </div>
          )}
        </CardContent></Card>

        <Card>
          <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">ข้อมูลติดต่อ</h2>
          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทร <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors((prev) => ({ ...prev, phone: '' })) }}
              placeholder="เบอร์โทรศัพท์สำหรับติดต่อ"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={3}
            />
          </div>
        </CardContent></Card>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ยืนยันคำขอเช่า'}
        </Button>

        <Dialog open={!!errorMsg} onOpenChange={(open) => { if (!open) setErrorMsg('') }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
              <DialogDescription>{errorMsg}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setErrorMsg('')}>ตกลง</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  )
}
