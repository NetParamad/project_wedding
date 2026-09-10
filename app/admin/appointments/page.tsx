'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllAppointments } from '@/lib/supabase/queries'
import { Loader2, CalendarDays, ChevronRight, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { Appointment, AppointmentService, Product, ProductImage } from '@/lib/db.types'

const aptStatusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<(Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAllAppointments(supabase)
      setAppointments(data)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <CalendarDays size={48} className="mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">ยังไม่มีการนัดหมาย</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">การนัดหมาย</h1>
      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 850 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">ID</TableHead>
              <TableHead className="px-4 py-3 font-medium">ลูกค้า</TableHead>
              <TableHead className="px-4 py-3 font-medium">บริการ</TableHead>
              <TableHead className="px-4 py-3 font-medium">สินค้า</TableHead>
              <TableHead className="px-4 py-3 font-medium">วันที่</TableHead>
              <TableHead className="px-4 py-3 font-medium">เวลา</TableHead>
              <TableHead className="px-4 py-3 font-medium">สถานะ</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => {
              const serviceName = apt.service?.name || ''
              const customerName = apt.phone || '-'
              return (
                <TableRow key={apt.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3">#{apt.id}</TableCell>
                  <TableCell className="px-4 py-3">{customerName}</TableCell>
                  <TableCell className="px-4 py-3">{serviceName}</TableCell>
                  <TableCell className="px-4 py-3">
                    {apt.product ? (
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-muted">
                          {apt.product.images.length > 0 ? (
                            <img
                              src={apt.product.images.find(i => i.is_primary)?.url ?? apt.product.images[0].url}
                              alt={apt.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={14} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm">{apt.product.name}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3">{new Date(apt.appointment_date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell className="px-4 py-3">{apt.time_slot?.substring(0, 5)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`${statusColor(apt.status)} border-transparent`}>
                      {aptStatusLabels[apt.status] || apt.status}
                    </Badge>
                  </TableCell>  
                  <TableCell className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/appointments/${apt.id}`}>
                        ดู <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  )
}
