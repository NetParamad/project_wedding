import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/lib/supabase/queries'
import { CategoryForm } from '../category-form'

export default async function NewCategoryPage() {
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">หมวดหมู่ใหม่</h1>
        <p className="text-muted-foreground mt-1">
          สร้างหมวดหมู่สินค้าใหม่
        </p>
      </div>
      <CategoryForm categories={categories} />
    </div>
  )
}
