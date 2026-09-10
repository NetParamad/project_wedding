import type { Profile } from '@/lib/db.types'

export async function AdminHeader({ user }: { user: Profile }) {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">{user.display_name}</p>
          <p className="text-xs text-muted-foreground">ผู้ดูแล</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {user.display_name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  )
}
