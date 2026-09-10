'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserAppointments } from '@/lib/supabase/queries'
import { Loader2, CalendarDays, Eye, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Appointment, AppointmentService, Product, ProductImage } from '@/lib/db.types'

const statusLabels: Record<string, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<(Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?redirect=/appointments')
          return
        }
        const data = await getUserAppointments(supabase)
        setAppointments(data)
      } catch (err) {
        console.error('Failed to load appointments:', err)
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
        <h1 className="text-3xl font-bold">การนัดหมายของฉัน</h1>
        <Button asChild>
          <Link href="/appointments/book">จองนัดหมาย</Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <CalendarDays size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีการนัดหมาย</p>
          <Button asChild>
            <Link href="/products">เลือกชมสินค้า</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const serviceName = apt.service?.name || ''
            const productName = apt.product ? apt.product.name : null
            return (
              <Card key={apt.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  {productName && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                      {apt.product && apt.product.images.length > 0 ? (
                        <img
                          src={apt.product.images.find(i => i.is_primary)?.url ?? apt.product.images[0].url}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={18} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      #{apt.id} &middot; {new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} {apt.time_slot?.substring(0, 5)}
                    </p>
                    <p className="font-medium">{serviceName}{productName ? ` — ${productName}` : ''}</p>
                    <Badge className={`${statusColors[apt.status] || 'bg-gray-100 text-gray-800'} border-transparent`}>
                      {statusLabels[apt.status] || apt.status}
                    </Badge>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
                  <Link href={`/appointments/${apt.id}`}>
                    <Eye size={14} className="mr-1" /> ดู
                  </Link>
                </Button>
            </CardContent></Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
