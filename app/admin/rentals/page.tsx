'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllRentals } from '@/lib/supabase/queries'
import { Loader2, ChevronRight, ShoppingBagIcon, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import Link from 'next/link'
import type { Rental, Product, Profile, ProductImage } from '@/lib/db.types'

const rentalStatusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  active: 'กำลังเช่า',
  returned: 'คืนแล้ว',
  late: 'เกินกำหนด',
  cancelled: 'ยกเลิก',
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    returned: 'bg-green-100 text-green-800',
    late: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<(Rental & { product: Product & { images: ProductImage[] } })[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const data = await getAllRentals(supabase)
      setRentals(data)

      const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))]
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
        const map: Record<string, Profile> = {}
        profileData?.forEach((p) => { map[p.id] = p })
        setProfiles(map)
      }

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

  if (rentals.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <ShoppingBagIcon size={48} className="mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">ยังไม่มีรายการเช่า</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">รายการเช่า</h1>
      <Card>
        <CardContent className="p-0">
          <Table style={{ minWidth: 850 }}>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="px-4 py-3 font-medium">ID</TableHead>
                <TableHead className="px-4 py-3 font-medium">ลูกค้า</TableHead>
                <TableHead className="px-4 py-3 font-medium">ชุด</TableHead>
                <TableHead className="px-4 py-3 font-medium">วันที่เช่า</TableHead>
                <TableHead className="px-4 py-3 font-medium">วันที่คืน</TableHead>
                <TableHead className="px-4 py-3 font-medium">ราคา</TableHead>
                <TableHead className="px-4 py-3 font-medium">ประกัน</TableHead>
                <TableHead className="px-4 py-3 font-medium">สถานะ</TableHead>
                <TableHead className="px-4 py-3 text-right font-medium"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((rental) => (
                <TableRow key={rental.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3 font-mono text-xs">#{rental.id}</TableCell>
                  <TableCell className="px-4 py-3">{profiles[rental.user_id]?.display_name || profiles[rental.user_id]?.phone || '-'}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-muted">
                        {rental.product?.images && rental.product.images.length > 0 ? (
                          <img
                            src={rental.product.images.find(i => i.is_primary)?.url ?? rental.product.images[0].url}
                            alt={rental.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={14} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span>{rental.product?.name || `#${rental.product_id}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {new Date(rental.rental_start_date + 'T00:00:00').toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {new Date(rental.rental_end_date + 'T00:00:00').toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell className="px-4 py-3">฿{Number(rental.rental_price).toLocaleString()}</TableCell>
                  <TableCell className="px-4 py-3">฿{Number(rental.deposit_amount).toLocaleString()}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`${statusColor(rental.status)} border-transparent`}>
                      {rentalStatusLabels[rental.status] || rental.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/rentals/${rental.id}`}>
                        ดู <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
