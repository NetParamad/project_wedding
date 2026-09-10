'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDateLock, deleteDateLock } from '@/lib/supabase/queries'
import type { ProductDateLock } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  productId: number
  initialLocks: ProductDateLock[]
}

export function DateLockManager({ productId, initialLocks }: Props) {
  const router = useRouter()
  const [locks, setLocks] = useState(initialLocks)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [, setLockErrors] = useState<Record<string, string>>({})

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!startDate) newErrors.startDate = 'กรุณาเลือกวันที่เริ่มต้น'
    if (!endDate) newErrors.endDate = 'กรุณาเลือกวันที่สิ้นสุด'
    if (Object.keys(newErrors).length > 0) { setLockErrors(newErrors); return }
    setLockErrors({})
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('กรุณาเข้าสู่ระบบ')
        return
      }
      const lock = await createDateLock(supabase, {
        product_id: productId,
        lock_start_date: startDate,
        lock_end_date: endDate,
        reason: reason || undefined,
        created_by: user.id,
      })
      setLocks([...locks, lock])
      toast.success('เพิ่มการล็อควันจองแล้ว')
      setOpen(false)
      setStartDate('')
      setEndDate('')
      setReason('')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const supabase = createClient()
      await deleteDateLock(supabase, id)
      setLocks(locks.filter((l) => l.id !== id))
      toast.success('ลบการล็อควันจองแล้ว')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>การล็อควันจองชุดแต่งงาน</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              เพิ่มช่วงล็อค
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มช่วงล็อค</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">วันที่เริ่มต้น</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">วันที่สิ้นสุด</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">เหตุผล</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เหตุผลที่ล็อค (ไม่บังคับ)"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {locks.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มีการล็อควันจอง</p>
        ) : (
          <div className="space-y-3">
            {locks.map((lock) => (
              <div
                key={lock.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">จาก:</span>{' '}
                    {new Date(lock.lock_start_date).toLocaleDateString('th-TH')}
                    {' → '}
                    <span className="font-medium">ถึง:</span>{' '}
                    {new Date(lock.lock_end_date).toLocaleDateString('th-TH')}
                  </p>
                  {lock.reason && (
                    <p className="text-muted-foreground">{lock.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(lock.id)}
                  className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
