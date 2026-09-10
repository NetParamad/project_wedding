'use server'

import { createClient } from '@/lib/supabase/server'
import { isProductAvailable, createRental, createNotification, getProduct } from '@/lib/supabase/queries'
import { rentalDayCount } from '@/lib/date-utils'
import { revalidatePath } from 'next/cache'

const MAX_RENTAL_DAYS = 30

export async function createRentalAction(input: {
  product_id: number
  rental_start_date: string
  rental_end_date: string
  rental_price: number
  deposit_amount: number
  phone: string
  notes?: string
  product_name: string
  delivery_name?: string
  delivery_address?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!/^\d{10}$/.test(input.phone)) {
    throw new Error('กรุณาระบุเบอร์โทรศัพท์ 10 หลัก')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(input.rental_start_date + 'T00:00:00')
  const endDate = new Date(input.rental_end_date + 'T00:00:00')
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('วันที่ไม่ถูกต้อง')
  }
  if (startDate < today) throw new Error('วันที่เริ่มต้นต้องไม่เป็นวันที่ในอดีต')

  // Inclusive day count — must match the availability lock (see rentalDayCount).
  const days = rentalDayCount(input.rental_start_date, input.rental_end_date)
  if (days <= 0) throw new Error('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น')
  if (days > MAX_RENTAL_DAYS) throw new Error(`ระยะเวลาเช่าสูงสุด ${MAX_RENTAL_DAYS} วัน`)

  const product = await getProduct(supabase, input.product_id)
  if (!product) throw new Error('ไม่พบสินค้าที่เลือก')
  if (!product.is_active) throw new Error('สินค้านี้ปิดการใช้งานแล้ว')
  if (product.is_locked) throw new Error('สินค้านี้ถูกล็อกอยู่ ไม่สามารถเช่าได้')
  if (Number(product.rental_price) !== Number(input.rental_price)) {
    throw new Error('ราคาเช่าไม่ตรงกับระบบ')
  }
  if (Number(product.rental_deposit) !== Number(input.deposit_amount)) {
    throw new Error('จำนวนเงินมัดจำไม่ตรงกับระบบ')
  }

  const available = await isProductAvailable(
    supabase,
    input.product_id,
    input.rental_start_date,
    input.rental_end_date
  )
  if (!available) {
    throw new Error(
      'ไม่สามารถเช่าได้ในช่วงวันที่เลือก เนื่องจากชุดนี้ถูกล็อควันจองในวันดังกล่าว'
    )
  }

  const rental = await createRental(supabase, {
    user_id: user.id,
    product_id: input.product_id,
    rental_start_date: input.rental_start_date,
    rental_end_date: input.rental_end_date,
    rental_price: input.rental_price,
    deposit_amount: input.deposit_amount,
    phone: input.phone,
    notes: input.notes,
    delivery_name: input.delivery_name,
    delivery_address: input.delivery_address,
  })

  try {
    await createNotification(supabase, {
      user_id: user.id,
      type: 'general',
      title: 'คำขอเช่าชุดสำเร็จ!',
      message: `คุณได้ขอเช่า ${input.product_name} ตั้งแต่วันที่ ${new Date(input.rental_start_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} ถึง ${new Date(input.rental_end_date + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} (${days} วัน) รวมค่าเช่า ฿${(Number(input.rental_price) * days).toLocaleString()} + มัดจำ ฿${Number(input.deposit_amount).toLocaleString()}`,
      link: '/rentals',
    })
  } catch {}

  revalidatePath('/rentals')
  return { rentalId: rental.id }
}
