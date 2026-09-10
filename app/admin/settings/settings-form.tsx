'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StoreSettings, StoreSettingsFormData } from '@/lib/db.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { COLOR_THEMES, useColorTheme } from '@/components/color-theme-provider'
import type { ColorTheme } from '@/components/color-theme-provider'
import { hexToHsl } from '@/lib/color'

interface Props {
  initialData: StoreSettings | null
}

const themeLabel: Record<string, string> = {
  zinc: 'ซิงค์',
  rose: 'โรส',
  blue: 'น้ำเงิน',
  green: 'เขียว',
  orange: 'ส้ม',
  violet: 'ม่วง',
  custom: 'กำหนดเอง',
}

function assetUrl(path: string | null): string | undefined {
  if (!path) return undefined
  return `/api/store-asset?path=${encodeURIComponent(path)}`
}

export function SettingsForm({ initialData }: Props) {
  const router = useRouter()
  const { setTheme: applyColorTheme } = useColorTheme()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url ?? null)
  const [qrUrl, setQrUrl] = useState<string | null>(initialData?.promptpay_qr_url ?? null)
  const [pendingLogo, setPendingLogo] = useState<File | null>(null)
  const [pendingQr, setPendingQr] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null)

  const [form, setForm] = useState<StoreSettingsFormData>({
    store_name: '',
    promptpay_number: '',
    bank_name: '',
    bank_account: '',
    bank_account_name: '',
    theme: 'zinc',
    theme_custom_color: '',
    business_hours_start: '09:00',
    business_hours_end: '17:00',
    address: '',
    email: '',
    phone: '',
    facebook_url: '',
    instagram_url: '',
    line_url: '',
    tiktok_url: '',
    youtube_url: '',
    map_url: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        store_name: initialData.store_name,
        promptpay_number: initialData.promptpay_number ?? '',
        bank_name: initialData.bank_name ?? '',
        bank_account: initialData.bank_account ?? '',
        bank_account_name: initialData.bank_account_name ?? '',
        theme: initialData.theme ?? 'zinc',
        theme_custom_color: initialData.theme_custom_color ?? '',
        business_hours_start: initialData.business_hours_start ?? '09:00',
        business_hours_end: initialData.business_hours_end ?? '17:00',
        address: initialData.address ?? '',
        email: initialData.email ?? '',
        phone: initialData.phone ?? '',
        facebook_url: initialData.facebook_url ?? '',
        instagram_url: initialData.instagram_url ?? '',
        line_url: initialData.line_url ?? '',
        tiktok_url: initialData.tiktok_url ?? '',
        youtube_url: initialData.youtube_url ?? '',
        map_url: initialData.map_url ?? '',
      })
      setLogoUrl(initialData.logo_url)
      setQrUrl(initialData.promptpay_qr_url)
      setPendingLogo(null)
      setPendingQr(null)
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl)
      setLogoPreviewUrl(null)
      setQrPreviewUrl(null)
    }
  }, [initialData])

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl)
    }
  }, [])

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('อัปโหลดล้มเหลว')
      return null
    }

    return filePath
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    setPendingLogo(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
  }

  async function handleQRUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl)
    setPendingQr(file)
    setQrPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (form.promptpay_number && form.promptpay_number.replace(/\D/g, '').length !== 10)
      newErrors.promptpay_number = 'หมายเลขพร้อมเพย์ต้องมี 10 หลัก'
    if (form.bank_account && form.bank_account.replace(/\D/g, '').length > 12)
      newErrors.bank_account = 'หมายเลขบัญชีต้องไม่เกิน 12 หลัก'
    if (form.phone && form.phone.replace(/\D/g, '').length > 10)
      newErrors.phone = 'เบอร์โทรศัพท์ต้องไม่เกิน 10 หลัก'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      let savedLogoUrl = logoUrl
      let savedQrUrl = qrUrl

      if (pendingLogo) {
        const path = await uploadFile(pendingLogo, 'logos')
        if (path) savedLogoUrl = path
      }

      if (pendingQr) {
        const path = await uploadFile(pendingQr, 'promptpay')
        if (path) savedQrUrl = path
      }

      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: form.store_name,
          logo_url: savedLogoUrl,
          promptpay_number: form.promptpay_number || null,
          promptpay_qr_url: savedQrUrl,
          bank_name: form.bank_name || null,
          bank_account: form.bank_account || null,
          bank_account_name: form.bank_account_name || null,
          theme: form.theme || 'zinc',
          theme_custom_color: form.theme_custom_color || null,
          business_hours_start: form.business_hours_start || '09:00',
          business_hours_end: form.business_hours_end || '17:00',
          address: form.address || null,
          email: form.email || null,
          phone: form.phone || null,
          facebook_url: form.facebook_url || null,
          instagram_url: form.instagram_url || null,
          line_url: form.line_url || null,
          tiktok_url: form.tiktok_url || null,
          youtube_url: form.youtube_url || null,
          map_url: form.map_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (error) throw error

      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl)
      setPendingLogo(null)
      setPendingQr(null)
      setLogoPreviewUrl(null)
      setQrPreviewUrl(null)
      setLogoUrl(savedLogoUrl)
      setQrUrl(savedQrUrl)

      if (form.theme === 'custom' && form.theme_custom_color) {
        applyColorTheme('custom', form.theme_custom_color)
      } else {
        applyColorTheme((form.theme || 'zinc') as ColorTheme)
      }
      toast.success('บันทึกการตั้งค่าแล้ว!')
      router.refresh()
    } catch (err) {
      console.error('Settings save failed:', err)
      toast.error('บันทึกการตั้งค่าล้มเหลว')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลร้านค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">ชื่อร้าน <span className="text-destructive">*</span></Label>
            <Input
              id="store_name"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              placeholder="ชื่อร้าน"
              required
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>โลโก้ร้านค้า</Label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {(logoPreviewUrl || logoUrl) && (
                <div className="relative h-16 w-16 shrink-0 rounded-md border bg-muted overflow-hidden">
                  <img
                    src={logoPreviewUrl || assetUrl(logoUrl)}
                    alt="โลโก้ร้านค้า"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
                      setPendingLogo(null)
                      setLogoPreviewUrl(null)
                      setLogoUrl(null)
                    }}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}
              <Label
                htmlFor="logo-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload size={16} />
                {logoPreviewUrl || logoUrl ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เวลาเปิดทำการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_hours_start">เวลาเปิด</Label>
              <Input
                id="business_hours_start"
                type="time"
                value={form.business_hours_start}
                onChange={(e) => setForm({ ...form, business_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_hours_end">เวลาปิด</Label>
              <Input
                id="business_hours_end"
                type="time"
                value={form.business_hours_end}
                onChange={(e) => setForm({ ...form, business_hours_end: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลติดต่อ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 ถนนร้านค้า กรุงเทพฯ 10110"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@mystore.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
                }}
                maxLength={10}
                pattern="[0-9]{1,10}"
                placeholder="0812345678"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="map_url">URL แผนที่</Label>
              <Input
                id="map_url"
                value={form.map_url}
                onChange={(e) => setForm({ ...form, map_url: e.target.value })}
                placeholder="https://maps.google.com/?q=13.7563,100.5018"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>โซเชียลมีเดีย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">URL Facebook</Label>
              <Input
                id="facebook_url"
                value={form.facebook_url}
                onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                placeholder="https://facebook.com/mystore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">URL Instagram</Label>
              <Input
                id="instagram_url"
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                placeholder="https://instagram.com/mystore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line_url">URL Line</Label>
              <Input
                id="line_url"
                value={form.line_url}
                onChange={(e) => setForm({ ...form, line_url: e.target.value })}
                placeholder="https://line.me/R/ti/p/@mystore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok_url">URL TikTok</Label>
              <Input
                id="tiktok_url"
                value={form.tiktok_url}
                onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@mystore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube_url">URL YouTube</Label>
              <Input
                id="youtube_url"
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                placeholder="https://youtube.com/@mystore"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ธีมสี</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {COLOR_THEMES.map((ct) => {
              const isSelected = form.theme === ct.value
              return (
                <Button
                  key={ct.value}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (ct.value === 'custom') {
                      setForm({ ...form, theme: 'custom' })
                    } else {
                      setForm({ ...form, theme: ct.value, theme_custom_color: '' })
                    }
                  }}
                  className={`flex-col items-center gap-2 p-3 h-auto ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : ''
                  }`}
                >
                  <div className="flex gap-1 flex-wrap justify-center">
                    {ct.swatches.map((swatch, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full ${swatch}`} />
                    ))}
                  </div>
                  <span className="text-xs font-medium">
                    {themeLabel[ct.value] || ct.value}
                  </span>
                </Button>
              )
            })}
          </div>

          {form.theme === 'custom' && (
            <div className="mt-4 space-y-3">
              <Label>สีที่กำหนด</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={form.theme_custom_color || '#e11d48'}
                  onChange={(e) => {
                    const hex = e.target.value
                    setForm({ ...form, theme_custom_color: hex })
                    try {
                      const { h, s, l } = hexToHsl(hex)
                      document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`)
                      document.documentElement.style.setProperty('--primary-foreground', l > 55 ? '0 0% 10%' : '0 0% 98%')
                      document.documentElement.style.setProperty('--ring', `${h} ${s}% ${l}%`)
                      document.documentElement.setAttribute('data-color-theme', 'custom')
                    } catch {}
                  }}
                  className="h-10 w-10 p-0.5 cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {form.theme_custom_color || '#e11d48'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">รหัสสี Hex (เช่น #ff0000)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>พร้อมเพย์</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promptpay_number">เบอร์พร้อมเพย์</Label>
            <Input
              id="promptpay_number"
              value={form.promptpay_number}
              onChange={(e) => {
                setForm({ ...form, promptpay_number: e.target.value.replace(/\D/g, '').slice(0, 10) })
                if (errors.promptpay_number) setErrors((prev) => ({ ...prev, promptpay_number: '' }))
              }}
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="0812345678"
            />
            {errors.promptpay_number && <p className="text-sm text-destructive">{errors.promptpay_number}</p>}
          </div>

          <div className="space-y-2">
            <Label>QR Code พร้อมเพย์</Label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {(qrPreviewUrl || qrUrl) && (
                <div className="relative h-24 w-24 shrink-0 rounded-md border bg-muted overflow-hidden">
                  <img
                    src={qrPreviewUrl || assetUrl(qrUrl)}
                    alt="QR พร้อมเพย์"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl)
                      setPendingQr(null)
                      setQrPreviewUrl(null)
                      setQrUrl(null)
                    }}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}
              <Label
                htmlFor="qr-upload"
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload size={16} />
                {qrPreviewUrl || qrUrl ? 'เปลี่ยน QR' : 'อัปโหลด QR'}
              </Label>
              <Input
                id="qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQRUpload}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>บัญชีธนาคาร</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">ชื่อธนาคาร</Label>
              <Input
                id="bank_name"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="e.g., Kasikorn Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account">เลขที่บัญชี</Label>
              <Input
                id="bank_account"
                value={form.bank_account}
                onChange={(e) => {
                  setForm({ ...form, bank_account: e.target.value.replace(/\D/g, '').slice(0, 12) })
                  if (errors.bank_account) setErrors((prev) => ({ ...prev, bank_account: '' }))
                }}
                maxLength={12}
                pattern="[0-9]{1,12}"
                placeholder="123456789012"
              />
              {errors.bank_account && <p className="text-sm text-destructive">{errors.bank_account}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_name">ชื่อบัญชี</Label>
            <Input
              id="bank_account_name"
              value={form.bank_account_name}
              onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
              placeholder="Account holder name"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-8">
        <Button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </Button>
      </div>
    </form>
  )
}
