'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product, ProductImage } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Separator } from '@/components/ui/separator'
import { Trash2, Star, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  categories: Category[]
  initialData?: Product & { images?: ProductImage[] }
}

export function ProductForm({ categories, initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const slugEdited = useRef(false)
  const [images, setImages] = useState<ProductImage[]>(initialData?.images ?? [])

  const [form, setForm] = useState(() => initialData
      ? {
          category_id: initialData.category_id?.toString() ?? 'none',
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description ?? '',
          is_active: initialData.is_active,
          rental_price: initialData.rental_price.toString(),
          rental_deposit: initialData.rental_deposit.toString(),
          is_locked: initialData.is_locked,
          locked_reason: initialData.locked_reason ?? '',
        }
      : {
          category_id: 'none',
          name: '',
          slug: '',
          description: '',
          is_active: true,
          rental_price: '0',
          rental_deposit: '0',
          is_locked: false,
          locked_reason: '',
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

    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (isEditing && initialData) {
        const { data: img, error: imgError } = await supabase
          .from('product_images')
          .insert({
            product_id: initialData.id,
            url: urlData.publicUrl,
            is_primary: images.length === 0,
            sort_order: images.length,
          })
          .select()
          .single()

        if (imgError) throw imgError
        setImages([...images, img])
      } else {
        setImages([
          ...images,
          {
            id: -Date.now(),
            product_id: 0,
            url: urlData.publicUrl,
            is_primary: images.length === 0,
            sort_order: images.length,
            created_at: new Date().toISOString(),
          },
        ])
      }

      toast.success('อัปโหลดรูปภาพสำเร็จ!')
    } catch (err) {
      console.error(err)
      toast.error('อัปโหลดรูปภาพล้มเหลว')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteImage(imageId: number) {
    try {
      if (imageId > 0) {
        const supabase = createClient()
        await supabase.from('product_images').delete().eq('id', imageId)
      }
      setImages(images.filter((img) => img.id !== imageId))
      toast.success('ลบรูปภาพแล้ว')
    } catch (err) {
      console.error(err)
      toast.error('ลบรูปภาพล้มเหลว')
    }
  }

  async function handleSetPrimary(imageId: number) {
    if (!isEditing || !initialData) {
      setImages(
        images
          .map((img) => ({ ...img, is_primary: img.id === imageId }))
          .sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
      )
      return
    }

    try {
      const supabase = createClient()
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', initialData.id)

      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      setImages(
        images
          .map((img) => ({ ...img, is_primary: img.id === imageId }))
          .sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : 0))
      )
      toast.success('อัปเดตรูปหลักแล้ว')
    } catch (err) {
      console.error(err)
      toast.error('อัปเดตรูปหลักล้มเหลว')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const payload = {
        category_id: form.category_id && form.category_id !== 'none' ? parseInt(form.category_id) : null,
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        is_active: form.is_active,
        rental_price: parseFloat(form.rental_price) || 0,
        rental_deposit: parseFloat(form.rental_deposit) || 0,
        is_locked: form.is_locked,
        locked_reason: form.locked_reason || null,
      }

      if (isEditing && initialData) {
        const { error: updateErr } = await supabase
          .from('products')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)

        if (updateErr) {
          console.error('Product update error:', updateErr, 'keys:', Object.keys(updateErr), 'json:', JSON.stringify(updateErr))
          throw updateErr
        }

        const existingImages = images.filter((img) => img.id > 0)
        const newImages = images.filter((img) => img.id < 0)

        for (const img of newImages) {
          const { error: imgErr } = await supabase.from('product_images').insert({
            product_id: initialData.id,
            url: img.url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          })
          if (imgErr) {
            console.error('Image insert error:', imgErr, 'json:', JSON.stringify(imgErr))
            throw imgErr
          }
        }

        if (existingImages.length > 0 && !existingImages.some((i) => i.is_primary)) {
          const { error: primaryErr } = await supabase
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', existingImages[0].id)
          if (primaryErr) throw primaryErr
        }

        toast.success('อัปเดตสินค้าแล้ว!')
      } else {
        const { data: product, error: insertErr } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single()

        if (insertErr) {
          console.error('Product insert error:', insertErr, 'keys:', Object.keys(insertErr), 'json:', JSON.stringify(insertErr))
          throw insertErr
        }

        for (const img of images) {
          const { error: imgErr } = await supabase.from('product_images').insert({
            product_id: product.id,
            url: img.url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          })
          if (imgErr) {
            console.error('New image insert error:', imgErr, 'json:', JSON.stringify(imgErr))
            throw imgErr
          }
        }

        toast.success('สร้างสินค้าแล้ว!')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      console.error('Product form error:', err)
      console.error('Error type:', typeof err, 'keys:', err ? Object.keys(err as object) : 'null', 'json:', JSON.stringify(err))
      const msg = err && typeof err === 'object' ? String((err as Record<string, unknown>).message || (err as Record<string, unknown>).details || JSON.stringify(err) || '') : String(err)
      if (msg) {
        toast.error(msg)
      } else {
        toast.error('เกิดข้อผิดพลาด')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">หมวดหมู่</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่มีหมวดหมู่</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">ชื่อ <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ชื่อสินค้า"
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
              placeholder="product-slug"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="รายละเอียดสินค้า"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การจัดการ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_active: checked === true })
              }
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              แสดงต่อลูกค้า
            </Label>
          </div>

          <Separator className="my-4" />
          <h3 className="text-sm font-medium">การเช่า</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="rental_price">ราคาเช่า (บาท)</Label>
              <Input
                id="rental_price"
                type="number"
                min="0"
                step="0.01"
                value={form.rental_price}
                onChange={(e) => setForm({ ...form, rental_price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental_deposit">ค่าประกัน (บาท)</Label>
              <Input
                id="rental_deposit"
                type="number"
                min="0"
                step="0.01"
                value={form.rental_deposit}
                onChange={(e) => setForm({ ...form, rental_deposit: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              id="is_locked"
              checked={form.is_locked}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_locked: checked === true })
              }
            />
            <Label htmlFor="is_locked" className="cursor-pointer">
              ล็อคชุดนี้ (ไม่ให้ลูกค้าเลือก)
            </Label>
          </div>
          {form.is_locked && (
            <div className="mt-2 space-y-2">
              <Label htmlFor="locked_reason">เหตุผลที่ล็อค</Label>
              <Textarea
                id="locked_reason"
                value={form.locked_reason}
                onChange={(e) => setForm({ ...form, locked_reason: e.target.value })}
                placeholder="ชุดอยู่ระหว่างการซ่อม ฯลฯ"
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รูปภาพ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
            >
              <Upload size={16} />
              อัปโหลดรูป
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && (
              <span className="text-sm text-muted-foreground">กำลังอัปโหลด...</span>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-md border bg-muted overflow-hidden"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetPrimary(img.id)}
                      className={`h-8 w-8 rounded-full ${
                        img.is_primary
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white'
                          : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-muted-foreground'
                      }`}
                      title="ตั้งเป็นรูปหลัก"
                    >
                      <Star size={14} fill={img.is_primary ? 'currentColor' : 'none'} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(img.id)}
                      className="h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
                      title="ลบรูป"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {img.is_primary && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      รูปหลัก
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center gap-3 pb-8">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading
            ? 'กำลังบันทึก...'
            : isEditing
              ? 'อัปเดตสินค้า'
              : 'สร้างสินค้า'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="w-full sm:w-auto"
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  )
}
