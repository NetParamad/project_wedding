'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tags,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  House,
  Menu,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useState } from 'react'

function SidebarNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/products', label: 'สินค้า', icon: Package },
    { href: '/admin/categories', label: 'หมวดหมู่', icon: Tags },
    { href: '/admin/rentals', label: 'รายการเช่า', icon: ShoppingBag },
    { href: '/admin/appointments', label: 'การนัดหมาย', icon: CalendarDays },
    { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
  ]

  return (
    <>
      <div className="flex items-center justify-between p-4 h-16 border-b">
        {!collapsed && (
          <Link href="/admin" className="font-bold text-lg whitespace-nowrap">
            แผงจัดการ
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="shrink-0"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator />
      <div className="p-3">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <House size={18} className="shrink-0" />
          {!collapsed && <span>กลับหน้าร้าน</span>}
        </Link>
      </div>
    </>
  )
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const bottomTabs = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/products', label: 'สินค้า', icon: Package },
    { href: '/admin/rentals', label: 'รายการเช่า', icon: ShoppingBag },
    { href: '/admin/appointments', label: 'นัดหมาย', icon: CalendarDays },
  ]

  const overflowItems = [
    { href: '/admin/categories', label: 'หมวดหมู่', icon: Tags },
    { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
    { href: '/', label: 'กลับหน้าร้าน', icon: House },
  ]

  return (
    <>
      {/* Mobile: bottom nav with sheet for overflow */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-14">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href ||
              (tab.href !== '/admin' && pathname.startsWith(tab.href))

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

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex-col gap-0.5 flex-1 h-full rounded-none text-muted-foreground hover:text-foreground"
              >
                <Menu size={20} />
                <span className="text-[10px] font-medium">เพิ่มเติม</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 max-w-[85vw] p-0">
              <SheetTitle className="sr-only">แผงจัดการ</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 h-16 border-b">
                  <Link href="/admin" className="font-bold text-lg">แผงจัดการ</Link>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                  {overflowItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Desktop: inline sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-background transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>
    </>
  )
}
