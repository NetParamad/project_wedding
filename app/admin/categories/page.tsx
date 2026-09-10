import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteCategoryButton } from './delete-category-button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">หมวดหมู่</h1>
          <p className="text-muted-foreground mt-1">
            จัดการหมวดหมู่สินค้า
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus size={16} className="mr-2" />
            เพิ่มหมวดหมู่
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 600 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">ลำดับ</TableHead>
              <TableHead className="px-4 py-3 font-medium">ชื่อ</TableHead>
              <TableHead className="px-4 py-3 font-medium">Slug</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  ไม่มีหมวดหมู่
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3">{category.sort_order}</TableCell>
                  <TableCell className="px-4 py-3 font-medium">{category.name}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {category.slug}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/categories/${category.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil size={15} />
                        </Button>
                      </Link>
                      <DeleteCategoryButton id={category.id} />
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
