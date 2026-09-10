import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/supabase/queries'
import { Plus, Pencil, EyeOff, Package, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteProductButton } from './delete-product-button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default async function ProductsPage() {
  const supabase = await createClient()
  const products = await getProducts(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">สินค้า</h1>
          <p className="text-muted-foreground mt-1">
            จัดการแคตตาล็อกสินค้า
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus size={16} className="mr-2" />
            เพิ่มสินค้า
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 700 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">ลำดับ</TableHead>
              <TableHead className="px-4 py-3 font-medium">สินค้า</TableHead>
              <TableHead className="px-4 py-3 font-medium">ราคาเช่า</TableHead>
              <TableHead className="px-4 py-3 font-medium">ค่าประกัน</TableHead>
              <TableHead className="px-4 py-3 font-medium">สถานะ</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  ไม่พบสินค้า
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {(product.images?.find(i => i.is_primary) ?? product.images?.[0]) ? (
                          <img
                            src={(product.images?.find(i => i.is_primary) ?? product.images?.[0])!.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PackageIcon />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-sm">
                      ฿{Number(product.rental_price).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-sm">
                      ฿{Number(product.rental_deposit).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 space-y-1">
                    {product.is_locked ? (
                      <Badge variant="destructive" className="whitespace-nowrap">
                        <Lock size={14} className="inline mr-1" />ล็อค
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 whitespace-nowrap">
                        ว่าง
                      </Badge>
                    )}
                    {product.is_active ? (
                      <Badge variant="default" className="bg-green-600 block w-fit">
                        เปิดใช้งาน
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="block w-fit">
                        <EyeOff size={12} className="mr-1" />
                        ปิดใช้งาน
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil size={15} />
                        </Button>
                      </Link>
                      <DeleteProductButton id={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function PackageIcon() {
  return <Package size={18} className="text-muted-foreground" />
}
