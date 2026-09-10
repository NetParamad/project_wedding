'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createAppointment,
  createNotification,
  getAppointmentsByDate,
  getActiveAppointmentServices,
  getProduct,
  isProductAvailableForAppointment,
} from '@/lib/supabase/queries'
import { revalidatePath } from 'next/cache'

const OPEN_HOUR = 9
const CLOSE_HOUR = 18

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function createAppointmentAction(input: {
  service_id: number
  product_id: number | null
  appointment_date: string
  time_slot: string
  phone: string
  notes?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!/^\d{10}$/.test(input.phone)) {
    throw new Error('กรุณาระบุเบอร์โทรศัพท์ 10 หลัก')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const aptDate = new Date(input.appointment_date + 'T00:00:00')
  if (Number.isNaN(aptDate.getTime())) throw new Error('วันที่ไม่ถูกต้อง')
  if (aptDate < today) throw new Error('เลือกวันนัดเป็นวันนี้หรือวันถัดไป (ย้อนหลังไม่ได้)')

  const services = await getActiveAppointmentServices(supabase)
  const service = services.find((s) => s.id === input.service_id)
  if (!service) throw new Error('ไม่พบบริการที่เลือก')

  // Time slot is validated and end_time is derived server-side from the
  // service duration — never trust the client's end_time.
  const slotMatch = /^(\d{2}):(\d{2})$/.exec(input.time_slot)
  if (!slotMatch) throw new Error('เวลาที่เลือกไม่ถูกต้อง')
  const startHour = Number(slotMatch[1])
  const startMin = Number(slotMatch[2])
  if (startMin !== 0 || startHour < OPEN_HOUR || startHour >= CLOSE_HOUR) {
    throw new Error('เวลาที่เลือกไม่ถูกต้อง')
  }
  const startMinutes = startHour * 60
  const endMinutes = startMinutes + service.duration_minutes
  if (endMinutes > CLOSE_HOUR * 60) {
    throw new Error('เวลาที่เลือกเลยเวลาทำการ กรุณาเลือกเวลาอื่น')
  }
  const time_slot = toHHMM(startMinutes)
  const end_time = toHHMM(endMinutes)

  const occupiedSlots = await getAppointmentsByDate(supabase, input.appointment_date)
  const conflict = occupiedSlots.some((occ) => {
    if (occ.service_id !== service.id) return false
    return time_slot < occ.end_time && end_time > occ.time_slot
  })
  if (conflict) throw new Error('ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น')

  if (input.product_id) {
    const product = await getProduct(supabase, input.product_id)
    if (!product || !product.is_active) {
      throw new Error('ไม่พบสินค้าที่เลือก หรือสินค้านี้ปิดการใช้งานแล้ว')
    }
    if (product.is_locked) {
      throw new Error('สินค้านี้ถูกล็อกอยู่ กรุณาเลือกสินค้าอื่น')
    }
    const productAvailable = await isProductAvailableForAppointment(supabase, input.product_id, input.appointment_date)
    if (!productAvailable) {
      throw new Error('สินค้าที่เลือกไม่ว่างในวันที่ต้องการ กรุณาเลือกสินค้าอื่น')
    }
  }

  await createAppointment(supabase, {
    user_id: user.id,
    service_id: input.service_id,
    product_id: input.product_id,
    appointment_date: input.appointment_date,
    time_slot,
    end_time,
    phone: input.phone,
    notes: input.notes,
  })

  try {
    await createNotification(supabase, {
      user_id: user.id,
      type: 'appointment_update',
      title: 'นัดลองชุดสำเร็จแล้ว',
      message: `นัด ${service.name} วันที่ ${new Date(input.appointment_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} เวลา ${time_slot} น.`,
      link: '/appointments',
    })
  } catch {}

  revalidatePath('/appointments')
  return { success: true }
}
