import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { SearchBar } from '@/components/search-bar'
import { CategoryFilter } from './category-filter'
import { ProductGrid } from './_components/product-grid'

interface Props {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">สินค้า</h1>
          <p className="text-muted-foreground mt-1">เลือกชมสินค้า</p>
        </div>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
        <CategoryFilter
          categories={categories}
          selected={undefined}
          mobile
        />
      </div>

      <Suspense fallback={<div className="text-center py-16">สินค้า...</div>}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
