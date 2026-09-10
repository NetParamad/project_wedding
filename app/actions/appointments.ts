'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createAppointment,
  createNotification,
  getAppointmentsByDate,
  getActiveAppointmentServices,
  isProductAvailableForAppointment,
} from '@/lib/supabase/queries'
import { revalidatePath } from 'next/cache'

export async function createAppointmentAction(input: {
  service_id: number
  product_id: number | null
  appointment_date: string
  time_slot: string
  end_time: string
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
  if (aptDate < today) throw new Error('วันที่นัดหมายต้องไม่เป็นวันที่ในอดีต')

  const services = await getActiveAppointmentServices(supabase)
  const service = services.find((s) => s.id === input.service_id)
  if (!service) throw new Error('ไม่พบบริการที่เลือก')

  const occupiedSlots = await getAppointmentsByDate(supabase, input.appointment_date)
  const conflict = occupiedSlots.some((occ) => {
    if (occ.service_id !== service.id) return false
    return input.time_slot < occ.end_time && input.end_time > occ.time_slot
  })
  if (conflict) throw new Error('ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น')

  if (input.product_id) {
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
    time_slot: input.time_slot,
    end_time: input.end_time,
    phone: input.phone,
    notes: input.notes,
  })

  try {
    await createNotification(supabase, {
      user_id: user.id,
      type: 'appointment_update',
      title: 'จองนัดหมายสำเร็จ!',
      message: `คุณได้จอง ${service.name} ในวันที่ ${new Date(input.appointment_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} เวลา ${input.time_slot.substring(0, 5)}`,
      link: '/appointments',
    })
  } catch {}

  revalidatePath('/appointments')
  return { success: true }
}
