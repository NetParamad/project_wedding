import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getCategory } from '@/lib/supabase/queries'
import { CategoryForm } from '../../category-form'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const categoryId = parseInt(id, 10)
  if (isNaN(categoryId)) notFound()

  const supabase = await createClient()
  const [categories, category] = await Promise.all([
    getCategories(supabase),
    getCategory(supabase, categoryId),
  ])

  if (!category) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">แก้ไขหมวดหมู่</h1>
        <p className="text-muted-foreground mt-1">
          แก้ไขหมวดหมู่ &ldquo;{category.name}&rdquo;
        </p>
      </div>
      <CategoryForm categories={categories} initialData={category} />
    </div>
  )
}
