'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function DeleteProductButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      const supabase = createClient()

      const { count: rentalCount } = await supabase
        .from('rentals').select('*', { count: 'exact', head: true }).eq('product_id', id)
      const { count: appointmentCount } = await supabase
        .from('appointments').select('*', { count: 'exact', head: true }).eq('product_id', id)
      const { count: lockCount } = await supabase
        .from('product_date_locks').select('*', { count: 'exact', head: true }).eq('product_id', id)

      const refs: string[] = []
      if (rentalCount) refs.push(`รายการเช่า (${rentalCount})`)
      if (appointmentCount) refs.push(`การนัดหมาย (${appointmentCount})`)
      if (lockCount) refs.push(`การล็อควันที่ (${lockCount})`)

      if (refs.length) {
        toast.error(`ไม่สามารถลบสินค้าที่มีข้อมูลเชื่อมโยง: ${refs.join(', ')}`)
        return
      }

      await supabase.from('product_images').delete().eq('product_id', id)

      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setOpen(false)
      toast.success('ลบสินค้าแล้ว')
      router.refresh()
    } catch (err) {
      const msg = (err as { message?: string })?.message || 'ไม่สามารถลบสินค้าได้'
      toast.error(msg)
      console.error('Failed to delete product:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 size={15} className="text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ลบสินค้า</DialogTitle>
          <DialogDescription>
            แน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
