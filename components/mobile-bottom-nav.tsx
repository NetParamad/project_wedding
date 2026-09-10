'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { House, Package, ShoppingBag, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
    })
  }, [])

  if (pathname.startsWith('/admin')) return null

  const loggedOutTabs = [
    { href: '/', label: 'หน้าแรก', icon: House },
    { href: '/products', label: 'สินค้า', icon: Package },
    { href: '/products/rent', label: 'เช่าชุด', icon: ShoppingBag },
    { href: '/appointments/book', label: 'จอง', icon: CalendarDays },
    { href: '/auth/login', label: 'เข้าสู่ระบบ', icon: User },
  ]

  const loggedInTabs = [
    { href: '/', label: 'หน้าแรก', icon: House },
    { href: '/products', label: 'สินค้า', icon: Package },
    { href: '/rentals', label: 'รายการเช่า', icon: ShoppingBag },
    { href: '/appointments', label: 'นัดหมาย', icon: CalendarDays },
    { href: '/profile', label: 'บัญชี', icon: User },
  ]

  const tabs = loggedIn ? loggedInTabs : loggedOutTabs

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
