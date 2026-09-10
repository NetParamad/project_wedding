import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/supabase/queries'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const settings = await getStoreSettings(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ตั้งค่า</h1>
        <p className="text-muted-foreground mt-1">
          จัดการการตั้งค่าร้านค้า
        </p>
      </div>
      <SettingsForm initialData={settings} />
    </div>
  )
}
