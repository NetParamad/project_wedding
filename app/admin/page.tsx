import { createClient } from '@/lib/supabase/server'
import { getCategories, getProducts, getDashboardStats } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Package, Tags, ShoppingCart, CalendarRange, DollarSign, TrendingUp, Clock, ShoppingBagIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from './revenue-chart'
import { RentalsByStatusChart } from './rentals-status-chart'
import { BookingChart } from './booking-chart'
import { BookingStatusChart } from './booking-status-chart'

const rentalStatusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  active: 'กำลังเช่า',
  returned: 'คืนแล้ว',
  late: 'เกินกำหนด',
  cancelled: 'ยกเลิก',
}

const rentalStatusColor: Record<string, string> = {
  pending: 'bg-yellow-500',
  active: 'bg-blue-500',
  returned: 'bg-green-500',
  late: 'bg-red-500',
  cancelled: 'bg-gray-500',
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const [categories, products, stats] = await Promise.all([
    getCategories(supabase),
    getProducts(supabase),
    getDashboardStats(supabase),
  ])

  const totalStock = products.reduce((sum, p) => sum + p.stock_qty, 0)
  const inactiveProducts = products.filter((p) => !p.is_active).length

  const statusCards = [
    {
      title: 'รายการเช่าทั้งหมด',
      value: stats.totalRentals,
      icon: ShoppingBagIcon,
      description: `${stats.todayRentals} วันนี้`,
    },
    {
      title: 'รายได้ทั้งหมด',
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'จากราคาเช่า (ไม่รวมที่ยกเลิก)',
    },
    {
      title: 'รอดำเนินการ',
      value: stats.pendingRentals,
      icon: Clock,
      description: 'รายการเช่าที่รอยืนยัน',
    },
    {
      title: 'สินค้าทั้งหมด',
      value: products.length,
      icon: Package,
      description: `${inactiveProducts} รายการที่ปิดใช้งาน`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground mt-1">
          ภาพรวมของร้านค้า
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart data={stats.revenueByDay} />
        <RentalsByStatusChart data={stats.rentalsByStatus} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สินค้าที่เช่ามากที่สุด</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการเช่า</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product, idx) => (
                  <div key={product.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">#{idx + 1}</span>
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{product.name}</span>
                    </div>
                    <span className="text-muted-foreground">เช่าแล้ว {product.qty} ครั้ง</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">รายการเช่าล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRentals.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการเช่า</p>
            ) : (
              <div className="space-y-3">
                {stats.recentRentals.map((rental) => (
                  <div key={rental.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${rentalStatusColor[rental.status] || 'bg-gray-500'}`} />
                      <span>#{rental.id}</span>
                      <span className="text-muted-foreground">
                        {rental.product?.name || `#${rental.product_id}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        rental.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        rental.status === 'returned' ? 'bg-green-100 text-green-800' :
                        rental.status === 'late' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-800'} border-transparent text-xs`}>
                        {rentalStatusLabels[rental.status] || rental.status}
                      </Badge>
                      <span className="text-muted-foreground">฿{Number(rental.rental_price).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BookingChart data={stats.topBookedProducts} />
        <BookingStatusChart data={stats.appointmentsByStatus} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">หมวดหมู่</CardTitle>
            <Tags size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">หมวดหมู่สินค้า</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">สต็อกสินค้า</CardTitle>
            <ShoppingCart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground mt-1">สินค้าที่มี</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">การนัดหมาย</CardTitle>
            <CalendarRange size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.todayAppointments} วันนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ดำเนินการด่วน</CardTitle>
            <TrendingUp size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/products/new">เพิ่มสินค้า</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/rentals">ดูรายการเช่า</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
