'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAppointmentServices } from '@/lib/supabase/queries'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import type { AppointmentService } from '@/lib/db.types'

const typeLabels: Record<string, string> = {
  try_on: 'ลองชุด',
  consultation: 'ปรึกษา',
}

export default function AdminAppointmentServicesPage() {
  const [services, setServices] = useState<AppointmentService[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AppointmentService | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('try_on')
  const [formDuration, setFormDuration] = useState('30')
  const [formPrice, setFormPrice] = useState('0')
  const [formActive, setFormActive] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    setLoading(true)
    const supabase = createClient()
    const data = await getAppointmentServices(supabase)
    setServices(data)
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setFormName('')
    setFormDesc('')
    setFormType('try_on')
    setFormDuration('30')
    setFormPrice('0')
    setFormActive(true)
    setOpen(true)
  }

  function openEdit(svc: AppointmentService) {
    setEditing(svc)
    setFormName(svc.name)
    setFormDesc(svc.description || '')
    setFormType(svc.type)
    setFormDuration(svc.duration_minutes.toString())
    setFormPrice((svc.price ?? 0).toString())
    setFormActive(svc.is_active)
    setOpen(true)
  }

  async function handleSave() {
    if (!formName || !formDuration) return
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: formName,
        description: formDesc || null,
        type: formType,
        duration_minutes: parseInt(formDuration),
        price: parseFloat(formPrice) || 0,
        is_active: formActive,
      }
      if (editing) {
        await supabase.from('appointment_services').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('appointment_services').insert(payload)
      }
      setOpen(false)
      fetchServices()
    } catch (err) {
      console.error(err)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('แน่ใจหรือไม่ว่าต้องการลบบริการนี้?')) return
    const supabase = createClient()
    await supabase.from('appointment_services').delete().eq('id', id)
    fetchServices()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold">บริการ</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> สร้างบริการ
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
        <Table style={{ minWidth: 700 }}>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium">ID</TableHead>
              <TableHead className="px-4 py-3 font-medium">ชื่อ</TableHead>
              <TableHead className="px-4 py-3 font-medium">ประเภท</TableHead>
              <TableHead className="px-4 py-3 font-medium">เวลา (นาที)</TableHead>
              <TableHead className="px-4 py-3 font-medium">ราคา</TableHead>
              <TableHead className="px-4 py-3 font-medium">สถานะ</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((svc) => {
              return (
                <TableRow key={svc.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="px-4 py-3">{svc.id}</TableCell>
                  <TableCell className="px-4 py-3 font-medium">{svc.name}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="secondary" className="rounded-full">
                      {typeLabels[svc.type] || svc.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">{svc.duration_minutes} นาที</TableCell>
                  <TableCell className="px-4 py-3">{svc.price > 0 ? `฿${svc.price}` : 'ฟรี'}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`rounded-full border-transparent ${svc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {svc.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(svc)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(svc.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'แก้ไขบริการ' : 'สร้างบริการ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อ <span className="text-destructive">*</span></Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>คำอธิบาย</Label>
                <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>ประเภท <span className="text-destructive">*</span></Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="try_on">ลองชุด</SelectItem>
                    <SelectItem value="consultation">ปรึกษา</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>เวลา (นาที) <span className="text-destructive">*</span></Label>
                <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} min={15} required />
              </div>
              <div className="space-y-2">
                <Label>ราคา</Label>
                <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} min={0} />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Checkbox id="is_active" checked={formActive} onCheckedChange={(checked) => setFormActive(!!checked)} />
                <Label htmlFor="is_active" className="mb-0">เปิดใช้งาน</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving || !formName} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
