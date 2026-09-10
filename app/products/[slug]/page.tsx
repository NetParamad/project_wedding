import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/lib/supabase/queries'
import { ProductGallery } from './product-gallery'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const product = await getProductBySlug(supabase, slug)

  if (!product) notFound()

  const images = product.images ?? []
  const productName = product.name

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft size={16} />
        กลับไปสินค้าทั้งหมด
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {images.length > 0 ? (
          <ProductGallery images={images} productName={productName} />
        ) : (
          <Card>
            <CardContent className="aspect-square p-0 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
            ไม่มีรูป
          </CardContent></Card>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{productName}</h1>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                บริการเช่าชุด
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>ราคาเช่า: ฿{Number(product.rental_price).toLocaleString()} / วัน</p>
                {Number(product.rental_deposit) > 0 && (
                  <p>ค่าประกัน: ฿{Number(product.rental_deposit).toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/appointments/book?product=${product.slug}`}>
                จอง (ลองชุด)
              </Link>
            </Button>
            <Button asChild variant="default" className="w-full">
              <Link href={`/rentals/new?product=${product.slug}`}>
                เช่าชุด
              </Link>
            </Button>
          </div>

          {product.description && (
            <div className="space-y-2">
              <h3 className="font-medium">รายละเอียด</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
