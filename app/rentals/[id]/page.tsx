'use client'

import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRental } from '@/lib/supabase/queries'
import { Loader2, ArrowLeft, CheckCircle, Circle, AlertTriangle, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Rental, Product, ProductImage } from '@/lib/db.types'

const statusSteps = ['pending', 'active', 'returned']

const statusLabels: Record<string, string> = {
  pending: 'รอยืนยัน',
  active: 'กำลังเช่า',
  returned: 'คืนแล้ว',
  late: 'เกินกำหนด',
  cancelled: 'ยกเลิก',
}

function formatDateThai(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function RentalDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <RentalDetailContent />
    </Suspense>
  )
}

function RentalDetailContent() {
  const router = useRouter()
  const params = useParams()
  const [rental, setRental] = useState<(Rental & { product: Product & { images: ProductImage[] } }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?redirect=/rentals')
          return
        }
        const data = await getRental(supabase, Number(params.id))
        if (!data) {
          router.push('/rentals')
          return
        }
        setRental(data)
      } catch (err) {
        console.error('Failed to load rental:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [router, params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!rental) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">ไม่พบรายการเช่า</p>
            <Button asChild variant="outline">
              <Link href="/rentals">
                <ArrowLeft size={16} className="mr-1" /> กลับไปรายการเช่า
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCancelled = rental.status === 'cancelled'
  const currentStep = statusSteps.indexOf(rental.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/rentals">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">รายละเอียดการเช่า</h1>
          <p className="text-sm text-muted-foreground">
            #{rental.id} &middot; {rental.product.name}
          </p>
        </div>
      </div>

      {isCancelled ? (
        <Card className="bg-red-50 border-red-200 text-center text-red-700 font-medium">
          <CardContent className="p-4">
            รายการเช่านี้ถูกยกเลิกแล้ว
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {statusSteps.map((step, idx) => {
            const isLate = rental.status === 'late' && step === 'active'
            return (
              <div key={step} className="flex items-center gap-3">
                {step === 'returned' && rental.status === 'late' ? (
                  <Circle className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" />
                ) : idx < currentStep ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                ) : idx === currentStep ? (
                  <Circle className={isLate ? 'w-5 h-5 text-red-500 shrink-0' : 'w-5 h-5 text-primary shrink-0'} fill="currentColor" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                )}
                <span className={
                  idx <= currentStep && !(isLate && idx === currentStep)
                    ? 'font-medium'
                    : isLate && idx === currentStep
                      ? 'font-medium text-red-600'
                      : 'text-muted-foreground'
                }>
                  {statusLabels[step]}
                  {isLate && idx === currentStep && <AlertTriangle size={14} className="inline ml-1" />}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
        <h2 className="font-semibold">รายละเอียด</h2>
        <div className="flex items-start gap-4 mb-3">
          <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
            {rental.product.images.length > 0 ? (
              <img
                src={rental.product.images.find(i => i.is_primary)?.url ?? rental.product.images[0].url}
                alt={rental.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={28} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">สินค้า</span>
            <p className="font-medium text-lg">{rental.product.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground">สถานะ</span>
            <Badge className={`${statusLabels[rental.status] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} border-transparent`}>
              {statusLabels[rental.status] || rental.status}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">วันที่เริ่มเช่า</span>
            <p className="font-medium">{formatDateThai(rental.rental_start_date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">วันที่สิ้นสุดเช่า</span>
            <p className="font-medium">{formatDateThai(rental.rental_end_date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ราคาเช่า</span>
            <p className="font-medium">฿{Number(rental.rental_price).toLocaleString()} / วัน</p>
          </div>
          <div>
            <span className="text-muted-foreground">จำนวนวันที่เช่า</span>
            <p className="font-medium">{(() => { const s = new Date(rental.rental_start_date + 'T00:00:00'); const e = new Date(rental.rental_end_date + 'T00:00:00'); return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) })()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">ค่าประกัน</span>
            <p className="font-medium">฿{Number(rental.deposit_amount).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">รวมทั้งสิ้น</span>
            <p className="font-medium">฿{(Number(rental.rental_price) * (() => { const s = new Date(rental.rental_start_date + 'T00:00:00'); const e = new Date(rental.rental_end_date + 'T00:00:00'); return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) })() + Number(rental.deposit_amount)).toLocaleString()}</p>
          </div>
          {rental.returned_at && (
            <div>
              <span className="text-muted-foreground">วันที่คืน</span>
              <p className="font-medium">{new Date(rental.returned_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}
          {Number(rental.return_penalty) > 0 && (
            <div>
              <span className="text-muted-foreground">ค่าปรับ</span>
              <p className="font-medium text-red-600">฿{Number(rental.return_penalty).toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent></Card>

      {rental.notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">หมายเหตุ</h2>
          <p className="text-muted-foreground">{rental.notes}</p>
        </CardContent></Card>
      )}

      {rental.return_notes && (
        <Card>
          <CardContent className="p-4 text-sm space-y-1">
          <h2 className="font-semibold mb-1">บันทึกการคืน</h2>
          <p className="text-muted-foreground">{rental.return_notes}</p>
        </CardContent></Card>
      )}
    </div>
  )
}
