import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile(supabase)

  if (profile?.role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader user={profile} />
          <main className="flex-1 p-4 sm:p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    )
  }

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  if (count === 0) {
    redirect('/setup-admin')
  }

  redirect('/')
}
