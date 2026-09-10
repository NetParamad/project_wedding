'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProfile, updateProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Loader2, User, Save, ShoppingBag, CalendarDays, LayoutDashboard, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Profile } from '@/lib/db.types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/profile')
        return
      }
      const data = await getProfile(supabase)
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name ?? '')
        setPhone(data.phone ?? '')
      }
      setLoading(false)
    }
    fetch()
  }, [router])

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (phone && !/^\d{10}$/.test(phone)) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setSaving(true)
    setMessage('')
    try {
      const supabase = createClient()
      const updated = await updateProfile(supabase, {
        display_name: displayName || null,
        phone: phone || null,
      })
      setProfile(updated)
      setMessage('อัปเดตโปรไฟล์สำเร็จ')
    } catch {
      setMessage('ไม่สามารถอัปเดตโปรไฟล์ได้')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <User size={28} className="text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-muted-foreground">
            สมาชิกตั้งแต่: {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-muted-foreground capitalize">บทบาท: {profile.role}</p>
        </div>
      </div>

      <Separator />

      {message && (
        <div className={`rounded-lg p-3 text-sm font-medium ${
          message === 'อัปเดตโปรไฟล์สำเร็จ'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="displayName">ชื่อที่แสดง</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ชื่อที่แสดง"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: '' })) }}
            placeholder="098-XXX-XXXX"
            pattern="[0-9]{10}"
            title="กรุณากรอกเบอร์โทร 10 หลัก"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          <Save size={16} className="mr-1" />
          {saving ? 'กำลังโหลด...' : 'บันทึกการเปลี่ยนแปลง'}
        </Button>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-0 divide-y">
        <Link
          href="/rentals"
          className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">คำสั่งเช่า</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
          <Link
          href="/appointments"
          className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <CalendarDays size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">การนัดหมาย</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
        {profile.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium">จัดการระบบ</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        )}
      </CardContent></Card>
    </div>
  )
}
