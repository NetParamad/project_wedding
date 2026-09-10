'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/supabase/queries'
import { Loader2, Bell, CheckCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { Notification } from '@/lib/db.types'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/notifications')
        return
      }
      const data = await getNotifications(supabase, user.id)
      setNotifications(data)
      setLoading(false)
    }
    fetch()
  }, [router])

  const handleMarkRead = async (id: number) => {
    const supabase = createClient()
    await markNotificationRead(supabase, id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await markAllNotificationsRead(supabase, user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">การแจ้งเตือน</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} รายการที่ยังไม่ได้อ่าน` : 'อ่านทั้งหมดแล้ว'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} className="mr-1" /> อ่านทั้งหมด
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Bell size={48} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>
          <Button asChild>
            <Link href="/products">เลือกชมสินค้า</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={!n.read ? 'bg-primary/5 border-primary/20' : ''}
            >
              <CardContent className="p-4 flex items-start gap-3">
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                !n.read ? 'bg-primary' : 'bg-transparent'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                {n.message && (
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {n.link && (
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href={n.link}><ArrowRight size={14} /></Link>
                  </Button>
                )}
                {!n.read && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkRead(n.id)}>
                    <CheckCheck size={14} />
                  </Button>
                )}
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
