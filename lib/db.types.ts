export interface Profile {
  id: string
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  category_id: number | null
  name: string
  slug: string
  description: string | null
  price: number
  stock_qty: number
  is_active: boolean
  rental_price: number
  rental_deposit: number
  is_locked: boolean
  locked_reason: string | null
  created_at: string
  updated_at: string
  images?: ProductImage[]
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export type CategoryFormData = {
  name: string
  slug: string
  description: string
  image_url: string
  parent_id: string
  sort_order: string
}

export interface ProductDateLock {
  id: number
  product_id: number
  lock_start_date: string
  lock_end_date: string
  reason: string | null
  created_at: string
  created_by: string | null
}

export interface AppointmentService {
  id: number
  type: 'try_on' | 'consultation'
  name: string
  description: string | null
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Rental {
  id: number
  user_id: string
  product_id: number
  appointment_id: number | null
  phone: string | null
  rental_start_date: string
  rental_end_date: string
  rental_price: number
  deposit_amount: number
  status: 'pending' | 'active' | 'returned' | 'late' | 'cancelled'
  returned_at: string | null
  return_condition: string | null
  return_penalty: number | null
  return_notes: string | null
  notes: string | null
  delivery_name: string | null
  delivery_address: string | null
  created_at: string
  updated_at: string
}

export type RentalFormData = {
  product_id: string
  rental_start_date: string
  rental_end_date: string
  rental_price: string
  deposit_amount: string
  notes: string
}

export interface Appointment {
  id: number
  user_id: string
  service_id: number
  product_id: number | null
  appointment_date: string
  time_slot: string
  end_time: string
  phone: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  is_rental: boolean
  rental_id: number | null
  admin_notes: string | null
  try_on_price: number | null
  try_on_only: boolean
  created_at: string
  updated_at: string
}

export type AppointmentFormData = {
  service_id: string
  product_id: string
  appointment_date: string
  time_slot: string
  phone: string
  notes: string
}

export interface StoreSettings {
  id: number
  store_name: string
  logo_url: string | null
  promptpay_number: string | null
  promptpay_qr_url: string | null
  bank_name: string | null
  bank_account: string | null
  bank_account_name: string | null
  theme: string
  theme_custom_color: string | null
  business_hours_start: string
  business_hours_end: string
  address: string | null
  email: string | null
  phone: string | null
  facebook_url: string | null
  instagram_url: string | null
  line_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  map_url: string | null
  updated_at: string
}

export type StoreSettingsFormData = {
  store_name: string
  promptpay_number: string
  bank_name: string
  bank_account: string
  bank_account_name: string
  theme: string
  theme_custom_color: string
  business_hours_start: string
  business_hours_end: string
  address: string
  email: string
  phone: string
  facebook_url: string
  instagram_url: string
  line_url: string
  tiktok_url: string
  youtube_url: string
  map_url: string
}

export interface Notification {
  id: number
  user_id: string
  type: 'general' | 'appointment_update'
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}
