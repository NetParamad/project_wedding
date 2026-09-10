'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

interface Props {
  categories: Category[]
  initialData?: Category
}

export function CategoryForm({ categories, initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData
  const slugEdited = useRef(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null)

  const [form, setForm] = useState(() => initialData
    ? {
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description ?? '',
        parent_id: initialData.parent_id?.toString() ?? 'none',
        sort_order: initialData.sort_order.toString(),
      }
    : {
        name: '',
        slug: '',
        description: '',
        parent_id: 'none',
        sort_order: '0',
      })

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugEdited.current ? prev.slug : generateSlug(value),
    }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `category/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath)

      setImageUrl(urlData.publicUrl)
      toast.success('อัปโหลดรูปภาพสำเร็จ!')
    } catch (err) {
      console.error(err)
      toast.error('อัปโหลดล้มเหลว')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        image_url: imageUrl,
        parent_id: form.parent_id && form.parent_id !== 'none' ? parseInt(form.parent_id) : null,
        sort_order: parseInt(form.sort_order) || 0,
      }

      if (isEditing && initialData) {
        const { error } = await supabase
          .from('categories')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)

        if (error) throw error
        toast.success('อัปเดตหมวดหมู่แล้ว!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload)

        if (error) throw error
        toast.success('สร้างหมวดหมู่แล้ว!')
      }

      router.push('/admin/categories')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อ <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ชื่อหมวดหมู่"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                const val = e.target.value
                slugEdited.current = val !== ''
                setForm((prev) => ({ ...prev, slug: val }))
              }}
              placeholder="category-slug"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="รายละเอียดหมวดหมู่"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>รูปภาพหมวดหมู่</Label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {imageUrl && (
                <div className="relative h-20 w-20 shrink-0 rounded-md border bg-muted overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="รูปหมวดหมู่"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}
              <Label
                htmlFor="category-image-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload size={16} />
                {imageUrl ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
              </Label>
              <Input
                id="category-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <span className="text-sm text-muted-foreground">กำลังอัปโหลด...</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_id">หมวดหมู่หลัก</Label>
            <Select
              value={form.parent_id}
              onValueChange={(v) => setForm({ ...form, parent_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ไม่มี (ระดับบนสุด)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่มี (ระดับบนสุด)</SelectItem>
                {categories
                  .filter((c) => c.id !== initialData?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">ลำดับการจัดเรียง</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-8">
        <Button type="submit" disabled={loading}>
          {loading
            ? 'กำลังบันทึก...'
            : isEditing
              ? 'อัปเดตหมวดหมู่'
              : 'สร้างหมวดหมู่'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/categories')}
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  )
}
