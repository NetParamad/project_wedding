'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserRentals } from '@/lib/supabase/queries'
import { Loader2, CalendarDays, Eye, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Rental, Product, ProductImage } from '@/lib/db.types'

const statusLabels: Record<string, string> = {
  pending: 'รอยืนยัน',
  active: 'กำลังเช่า',
  returned: 'คืนแล้ว',
  late: 'เกินกำหนด',
  cancelled: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  returned: 'bg-green-100 text-green-800',
  late: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

function formatDateThai(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function RentalsPage() {
  const router = useRouter()
  const [rentals, setRentals] = useState<(Rental & { product: Product & { images: ProductImage[] } })[]>([])
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
        const data = await getUserRentals(supabase)
        setRentals(data)
      } catch (err) {
        console.error('Failed to load rentals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">รายการเช่าของฉัน</h1>
        <Button asChild>
          <Link href="/rentals/new">เช่าชุด</Link>
        </Button>
      </div>

      {rentals.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <CalendarDays size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีรายการเช่า</p>
          <Button asChild>
            <Link href="/products/rent">เลือกชมสินค้า</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => (
            <Card key={rental.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {rental.product.images.length > 0 ? (
                    <img
                      src={rental.product.images.find(i => i.is_primary)?.url ?? rental.product.images[0].url}
                      alt={rental.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    #{rental.id} &middot; {rental.product.name}
                  </p>
                  <p className="text-sm">
                    {formatDateThai(rental.rental_start_date)} — {formatDateThai(rental.rental_end_date)}
                  </p>
                  <Badge className={`${statusColors[rental.status] || 'bg-gray-100 text-gray-800'} border-transparent`}>
                    {statusLabels[rental.status] || rental.status}
                  </Badge>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
                <Link href={`/rentals/${rental.id}`}>
                  <Eye size={14} className="mr-1" /> ดู
                </Link>
              </Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
