import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/supabase/queries'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function NotificationBell() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const unread = await getUnreadCount(supabase, user.id)

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/notifications" title="การแจ้งเตือน">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Link>
    </Button>
  )
}
