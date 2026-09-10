import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getProduct, getProductDateLocks } from '@/lib/supabase/queries'
import { ProductForm } from '../../product-form'
import { DateLockManager } from './date-lock-manager'
import { AvailabilityCalendar } from './availability-calendar'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) notFound()

  const supabase = await createClient()
  const [product, categories, dateLocks] = await Promise.all([
    getProduct(supabase, productId),
    getCategories(supabase),
    getProductDateLocks(supabase, productId),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">อัปเดตสินค้า</h1>
        <p className="text-muted-foreground mt-1">
          อัปเดตสินค้า &ldquo;{product.name}&rdquo;
        </p>
      </div>
      <ProductForm categories={categories} initialData={product} />
      <DateLockManager productId={productId} initialLocks={dateLocks} />
      <AvailabilityCalendar productId={productId} initialLocks={dateLocks} />
    </div>
  )
}
