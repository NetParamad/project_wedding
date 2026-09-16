import type { SupabaseClient } from '@supabase/supabase-js'
import type { Category, Product, ProductImage, Profile, StoreSettings, Appointment, AppointmentService, Rental, ProductDateLock } from '@/lib/db.types'
import { rentalDayCount } from '@/lib/date-utils'

// ─── Profiles ───

export async function getProfile(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data && error && error.code === 'PGRST116') {
    // Row missing (the handle_new_user trigger normally creates it). Upsert so a
    // race with the trigger doesn't turn into a duplicate-key error, then re-read.
    const { error: insertError } = await client
      .from('profiles')
      .upsert(
        { id: user.id, display_name: user.email, role: 'user' },
        { onConflict: 'id', ignoreDuplicates: true },
      )
    if (insertError) {
      console.error('getProfile: failed to create profile row', insertError)
    }
    const { data: newData } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    return (newData ?? null) as Profile | null
  }

  return data as Profile | null
}

export async function isAdmin(client: SupabaseClient) {
  const profile = await getProfile(client)
  return profile?.role === 'admin'
}

export async function updateProfile(
  client: SupabaseClient,
  data: Partial<Pick<Profile, 'display_name' | 'phone' | 'avatar_url'>>
) {
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: updated, error } = await client
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error
  return updated as Profile
}

// ─── Categories ───

export async function getCategories(client: SupabaseClient) {
  const { data } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return (data ?? []) as Category[]
}

export async function getCategory(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  return data as Category | null
}

export async function createCategory(
  client: SupabaseClient,
  input: {
    name: string
    slug: string
    description?: string
    parent_id?: number | null
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      parent_id: input.parent_id ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(
  client: SupabaseClient,
  id: number,
  input: {
    name?: string
    slug?: string
    description?: string
    parent_id?: number | null
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('categories')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Products ───

export async function getProducts(client: SupabaseClient) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function getProduct(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('id', id)
    .single()

  return data as (Product & { images: ProductImage[] }) | null
}

export async function createProduct(
  client: SupabaseClient,
  input: {
    category_id?: number | null
    name: string
    slug: string
    description?: string
    price?: number
    is_active?: boolean
  }
) {
  const { data, error } = await client
    .from('products')
    .insert({
      category_id: input.category_id ?? null,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      price: input.price ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(
  client: SupabaseClient,
  id: number,
  input: {
    category_id?: number | null
    name?: string
    slug?: string
    description?: string
    price?: number
    is_active?: boolean
  }
) {
  const { data, error } = await client
    .from('products')
    .update({
      ...input,
      category_id: input.category_id === undefined ? undefined : input.category_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function deleteProduct(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Product Images ───

export async function getProductImages(client: SupabaseClient, productId: number) {
  const { data } = await client
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  return (data ?? []) as ProductImage[]
}

export async function addProductImage(
  client: SupabaseClient,
  input: {
    product_id: number
    url: string
    is_primary?: boolean
    sort_order?: number
  }
) {
  const { data, error } = await client
    .from('product_images')
    .insert({
      product_id: input.product_id,
      url: input.url,
      is_primary: input.is_primary ?? false,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ProductImage
}

export async function deleteProductImage(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('product_images')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function setPrimaryImage(client: SupabaseClient, productId: number, imageId: number) {
  await client
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  const { error } = await client
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) throw error
}

// ─── Store Settings ───

function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http')) {
    const idx = url.indexOf('/store-assets/')
    if (idx !== -1) {
      return url.slice(idx + '/store-assets/'.length)
    }
    return url
  }
  return url
}

export async function getStoreSettings(client: SupabaseClient) {
  const { data } = await client
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (data) {
    data.logo_url = extractStoragePath(data.logo_url)
    data.promptpay_qr_url = extractStoragePath(data.promptpay_qr_url)
  }

  return data as StoreSettings | null
}

// ─── Appointment Services ───

export async function getAppointmentServices(client: SupabaseClient) {
  const { data } = await client
    .from('appointment_services')
    .select('*')
    .order('id', { ascending: true })

  return (data ?? []) as AppointmentService[]
}

export async function getActiveAppointmentServices(client: SupabaseClient) {
  const { data } = await client
    .from('appointment_services')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true })

  return (data ?? []) as AppointmentService[]
}

// ─── Appointments ───

export async function createAppointment(
  client: SupabaseClient,
  input: {
    user_id: string
    service_id: number
    product_id?: number | null
    appointment_date: string
    time_slot: string
    end_time: string
    phone: string
    notes?: string
  }
) {
  const { data, error } = await client
    .from('appointments')
    .insert({
      user_id: input.user_id,
      service_id: input.service_id,
      product_id: input.product_id ?? null,
      appointment_date: input.appointment_date,
      time_slot: input.time_slot,
      end_time: input.end_time,
      phone: input.phone,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    // exclusion constraint: the time slot was taken between our check and insert
    if ((error as { code?: string }).code === '23P01') {
      throw new Error('ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น')
    }
    throw error
  }
  return data as Appointment
}

export async function getUserAppointments(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*, images:product_images(*))')
    .eq('user_id', user?.id ?? '')
    .order('appointment_date', { ascending: false })
    .order('time_slot', { ascending: false })

  return (data ?? []) as (Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null })[]
}

export async function getAppointment(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*, images:product_images(*))')
    .eq('id', id)
    .single()

  return data as (Appointment & { service: AppointmentService } & { product: (Product & { images: ProductImage[] }) | null }) | null
}

export async function getAllAppointments(client: SupabaseClient) {
  const { data } = await client
    .from('appointments')
    .select('*, service:appointment_services(*), product:products(*, images:product_images(*))')
    .order('appointment_date', { ascending: false })
    .order('time_slot', { ascending: false })

  return (data ?? []) as (Appointment & {
    service: AppointmentService
    product: (Product & { images: ProductImage[] }) | null
  })[]
}

export async function updateAppointmentStatus(
  client: SupabaseClient,
  id: number,
  input: {
    status: Appointment['status']
    notes?: string
  }
) {
  const { data, error } = await client
    .from('appointments')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

export async function getAppointmentsByDate(client: SupabaseClient, date: string) {
  const { data } = await client.rpc('get_appointments_for_date', {
    p_date: date,
  })

  return ((data ?? []) as { id: number; time_slot: string; end_time: string; service_id: number }[]).map((row) => ({
    id: row.id,
    time_slot: row.time_slot.substring(0, 5),
    end_time: row.end_time.substring(0, 5),
    service_id: row.service_id,
  }))
}

// ─── Store Front ───

export async function getActiveProducts(
  client: SupabaseClient,
  options?: {
    category_id?: number
    search?: string
    page?: number
    pageSize?: number
    sort?: 'oldest' | 'price_desc' | 'price_asc'
  }
) {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('products')
    .select('*, images:product_images(*)', { count: 'exact' })
    .eq('is_active', true)

  if (options?.category_id) {
    query = query.eq('category_id', options.category_id)
  }

  if (options?.search) {
    // Escape PostgREST reserved characters so a term with a comma/paren/quote
    // can't alter the filter expression, then match the name column directly.
    const term = options.search.replace(/[,()"\\]/g, ' ').trim()
    if (term) query = query.ilike('name', `%${term}%`)
  }

  // Default sort: newest first (created_at desc).
  const sort = options?.sort
  const orderColumn = sort === 'price_desc' || sort === 'price_asc' ? 'price' : 'created_at'
  const ascending = sort === 'oldest' || sort === 'price_asc'

  const { data, count } = await query
    .order(orderColumn, { ascending })
    .range(from, to)

  return {
    products: (data ?? []) as (Product & { images: ProductImage[] })[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getAllActiveProducts(client: SupabaseClient) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function getProductBySlug(client: SupabaseClient, slug: string) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return data as (Product & { images: ProductImage[] }) | null
}

export async function getFeaturedProducts(
  client: SupabaseClient,
  limit = 6
) {
  const { data } = await client
    .from('products')
    .select('*, images:product_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as (Product & { images: ProductImage[] })[]
}

export async function updateStoreSettings(
  client: SupabaseClient,
  input: {
    store_name?: string
    logo_url?: string | null
    promptpay_number?: string | null
    promptpay_qr_url?: string | null
    bank_name?: string | null
    bank_account?: string | null
    bank_account_name?: string | null
    business_hours_start?: string
    business_hours_end?: string
    address?: string | null
    email?: string | null
    phone?: string | null
    facebook_url?: string | null
    instagram_url?: string | null
    line_url?: string | null
    tiktok_url?: string | null
    youtube_url?: string | null
    map_url?: string | null
  }
) {
  const { data, error } = await client
    .from('store_settings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data as StoreSettings
}

// ─── Dashboard ───

// Store timezone — every "which day did this happen" bucket below is computed
// in this zone so they agree with each other regardless of server TZ.
const STORE_TZ = 'Asia/Bangkok'

function storeDay(ts: string | Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: STORE_TZ })
}

// Rental days billed = same inclusive count the availability lock uses.
function calcRentalDays(r: { rental_start_date: string; rental_end_date: string }): number {
  return rentalDayCount(r.rental_start_date, r.rental_end_date)
}

// A rental only counts as revenue once it is no longer pending/cancelled.
function countsAsRevenue(status: string): boolean {
  return status !== 'cancelled' && status !== 'pending'
}

function rentalRevenue(r: { rental_price: number | string; rental_start_date: string; rental_end_date: string }): number {
  return Number(r.rental_price) * calcRentalDays(r)
}

export async function getDashboardStats(client: SupabaseClient) {
  const { data: rentals } = await client
    .from('rentals')
    .select('id, rental_price, deposit_amount, status, created_at, rental_start_date, rental_end_date, product_id, product:products(name)')
    .order('created_at', { ascending: false })

  const todayStore = storeDay(new Date())

  const totalRentals = rentals?.length ?? 0
  const totalRevenue = rentals
    ?.filter((r) => countsAsRevenue(r.status))
    .reduce((sum, r) => sum + rentalRevenue(r), 0) ?? 0
  const todayRentals = rentals
    ?.filter((r) => storeDay(r.created_at) === todayStore)
    .length ?? 0
  const pendingRentals = rentals
    ?.filter((r) => r.status === 'pending')
    .length ?? 0

  const rentalsByStatus: Record<string, number> = {}
  rentals?.forEach((r) => {
    rentalsByStatus[r.status] = (rentalsByStatus[r.status] || 0) + 1
  })

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return storeDay(d)
  }).reverse()

  const revenueByDay: { date: string; revenue: number }[] = last30.map((date) => ({
    date,
    revenue: rentals
      ?.filter((r) => storeDay(r.created_at) === date && countsAsRevenue(r.status))
      .reduce((sum, r) => sum + rentalRevenue(r), 0) ?? 0,
  }))

  const productRentalCounts: Record<string, { count: number; name: string; revenue: number }> = {}
  rentals?.forEach((r) => {
    if (!countsAsRevenue(r.status)) return
    const p = r.product as { name?: string } | null
    const name = p?.name ?? `#${r.product_id}`
    if (!productRentalCounts[name]) {
      productRentalCounts[name] = { count: 0, name, revenue: 0 }
    }
    productRentalCounts[name].count += 1
    productRentalCounts[name].revenue += rentalRevenue(r)
  })

  const topProducts = Object.entries(productRentalCounts)
    .map(([, data]) => ({ name: data.name, qty: data.count, revenue: data.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  const { data: recentRentals } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allAppointments } = await client
    .from('appointments')
    .select('id, created_at, status')
  const totalAppointments = allAppointments?.length ?? 0
  const todayAppointments = allAppointments
    ?.filter((a) => storeDay(a.created_at) === todayStore)
    .length ?? 0
  const appointmentsByStatus: Record<string, number> = {}
  allAppointments?.forEach((a) => {
    appointmentsByStatus[a.status] = (appointmentsByStatus[a.status] || 0) + 1
  })

  const { data: bookedProducts } = await client
    .from('appointments')
    .select('product_id, product:products(name)')
    .not('product_id', 'is', null)
    .neq('status', 'cancelled')

  const productBookingCounts: Record<string, number> = {}
  bookedProducts?.forEach((a) => {
    const p = a.product as { name?: string } | null
    const name = p?.name ?? `#${a.product_id}`
    productBookingCounts[name] = (productBookingCounts[name] || 0) + 1
  })

  const topBookedProducts = Object.entries(productBookingCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalRentals,
    totalRevenue,
    todayRentals,
    pendingRentals,
    rentalsByStatus,
    revenueByDay,
    topProducts,
    recentRentals: (recentRentals ?? []) as (Rental & { product: Product & { images: ProductImage[] } })[],
    totalAppointments,
    todayAppointments,
    appointmentsByStatus,
    topBookedProducts,
  }
}

// ─── Notifications ───

export async function getNotifications(client: SupabaseClient, userId: string) {
  const { data } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as import('@/lib/db.types').Notification[]
}

export async function getUnreadCount(client: SupabaseClient, userId: string) {
  const { count } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return count ?? 0
}

export async function markNotificationRead(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead(client: SupabaseClient, userId: string) {
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
}

export async function createNotification(
  client: SupabaseClient,
  input: {
    user_id: string
    type: 'general' | 'order_update' | 'payment_confirmed' | 'appointment_update'
    title: string
    message?: string
    link?: string
  }
) {
  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── Product Locks ───

export async function createDateLock(
  client: SupabaseClient,
  input: {
    product_id: number
    lock_start_date: string
    lock_end_date: string
    reason?: string
    created_by: string
  }
) {
  const { data, error } = await client
    .from('product_date_locks')
    .insert({
      product_id: input.product_id,
      lock_start_date: input.lock_start_date,
      lock_end_date: input.lock_end_date,
      reason: input.reason ?? null,
      created_by: input.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data as ProductDateLock
}

export async function getProductDateLocks(client: SupabaseClient, productId: number) {
  const { data } = await client
    .from('product_date_locks')
    .select('*')
    .eq('product_id', productId)
    .order('lock_start_date', { ascending: true })

  return (data ?? []) as ProductDateLock[]
}

export async function deleteDateLock(client: SupabaseClient, id: number) {
  const { error } = await client
    .from('product_date_locks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function isProductAvailable(
  client: SupabaseClient,
  productId: number,
  startDate: string,
  endDate?: string,
  blockAppointments: boolean = true
) {
  const end = endDate ?? startDate
  const { data } = await client.rpc('check_product_available', {
    p_product_id: productId,
    p_start_date: startDate,
    p_end_date: end,
    p_block_appointments: blockAppointments,
  })
  return data ?? false
}

export async function isProductAvailableForAppointment(
  client: SupabaseClient,
  productId: number,
  date: string
) {
  const { data } = await client.rpc('check_product_available', {
    p_product_id: productId,
    p_start_date: date,
    p_end_date: date,
    p_block_appointments: false,
  })
  return data ?? false
}

export async function getProductUnavailableDates(
  client: SupabaseClient,
  productId: number,
  startDate: string,
  endDate: string,
  blockFromAppointments: boolean = true
): Promise<string[]> {
  const { data } = await client.rpc('get_product_unavailable_dates', {
    p_product_id: productId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_block_from_appointments: blockFromAppointments,
  })
  return (data ?? []).map((row: { unavailable_date: string }) => row.unavailable_date)
}

// ─── Rentals ───

export async function createRental(
  client: SupabaseClient,
  input: {
    user_id: string
    product_id: number
    appointment_id?: number
    phone?: string
    rental_start_date: string
    rental_end_date: string
    rental_price: number
    deposit_amount: number
    notes?: string
    delivery_name?: string
    delivery_address?: string
  }
) {
  const { data, error } = await client
    .from('rentals')
    .insert({
      user_id: input.user_id,
      product_id: input.product_id,
      appointment_id: input.appointment_id ?? null,
      rental_start_date: input.rental_start_date,
      rental_end_date: input.rental_end_date,
      rental_price: input.rental_price,
      deposit_amount: input.deposit_amount,
      notes: input.notes ?? null,
      delivery_name: input.delivery_name ?? null,
      delivery_address: input.delivery_address ?? null,
    })
    .select()
    .single()

  if (error) {
    // exclusion constraint: the product got booked for overlapping dates
    if ((error as { code?: string }).code === '23P01') {
      throw new Error('ช่วงวันที่นี้เพิ่งถูกจองไปแล้ว กรุณาเลือกวันอื่น')
    }
    throw new Error(error.message)
  }
  return data as Rental
}

export async function getUserRentals(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Rental & { product: Product & { images: ProductImage[] } })[]
}

export async function getAllRentals(client: SupabaseClient) {
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .order('created_at', { ascending: false })

  return (data ?? []) as (Rental & { product: Product & { images: ProductImage[] } })[]
}

export async function getRental(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .eq('id', id)
    .maybeSingle()

  return data as (Rental & { product: Product & { images: ProductImage[] } }) | null
}

export async function getAdminRental(client: SupabaseClient, id: number) {
  const { data } = await client
    .from('rentals')
    .select('*, product:products(*, images:product_images(*))')
    .eq('id', id)
    .maybeSingle()

  return data as (Rental & { product: Product & { images: ProductImage[] } }) | null
}

export async function updateRentalStatus(
  client: SupabaseClient,
  id: number,
  status: Rental['status'],
  notes?: string
) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'returned') updates.returned_at = new Date().toISOString()
  if (notes !== undefined) updates.notes = notes

  const { error } = await client
    .from('rentals')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateRentalReturn(
  client: SupabaseClient,
  id: number,
  input: {
    status?: Rental['status']
    returned_at?: string
    return_condition?: string
    return_penalty?: number
    return_notes?: string
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.status !== undefined) updates.status = input.status
  if (input.returned_at !== undefined) updates.returned_at = input.returned_at
  if (input.return_condition !== undefined) updates.return_condition = input.return_condition
  if (input.return_penalty !== undefined) updates.return_penalty = input.return_penalty
  if (input.return_notes !== undefined) updates.return_notes = input.return_notes
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('rentals')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateRental(
  client: SupabaseClient,
  id: number,
  input: {
    rental_start_date?: string
    rental_end_date?: string
    rental_price?: number
    deposit_amount?: number
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.rental_start_date !== undefined) updates.rental_start_date = input.rental_start_date
  if (input.rental_end_date !== undefined) updates.rental_end_date = input.rental_end_date
  if (input.rental_price !== undefined) updates.rental_price = input.rental_price
  if (input.deposit_amount !== undefined) updates.deposit_amount = input.deposit_amount
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('rentals')
    .update(updates)
    .eq('id', id)

  if (error) {
    // exclusion constraint: the new dates overlap another rental of this product
    if ((error as { code?: string }).code === '23P01') {
      throw new Error('ช่วงวันที่นี้ทับกับรายการเช่าอื่นของชุดนี้ กรุณาเลือกวันอื่น')
    }
    throw error
  }
}

export async function getRentalsByProductInRange(
  client: SupabaseClient,
  productId: number,
  startDate: string,
  endDate: string
) {
  const { data, error } = await client.rpc('get_rentals_for_calendar', {
    p_product_id: productId,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) throw error

  return (data ?? []).map((r: { id: number; rental_start_date: string; rental_end_date: string; customer_name: string | null; status: string }) => ({
    id: r.id,
    rental_start_date: r.rental_start_date,
    rental_end_date: r.rental_end_date,
    customer_name: r.customer_name ?? null,
    status: r.status,
  }))
}

// ─── Admin Appointment Management ───

export async function updateAppointmentAdmin(
  client: SupabaseClient,
  id: number,
  input: {
    appointment_date?: string
    time_slot?: string
    end_time?: string
    product_id?: number | null
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.appointment_date !== undefined) updates.appointment_date = input.appointment_date
  if (input.time_slot !== undefined) updates.time_slot = input.time_slot
  if (input.end_time !== undefined) updates.end_time = input.end_time
  if (input.product_id !== undefined) updates.product_id = input.product_id
  if (input.notes !== undefined) updates.notes = input.notes

  const { error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function updateAppointmentCustomer(
  client: SupabaseClient,
  id: number,
  userId: string,
  input: {
    appointment_date?: string
    time_slot?: string
    end_time?: string
    product_id?: number | null
    notes?: string
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.appointment_date !== undefined) updates.appointment_date = input.appointment_date
  if (input.time_slot !== undefined) updates.time_slot = input.time_slot
  if (input.end_time !== undefined) updates.end_time = input.end_time
  if (input.product_id !== undefined) updates.product_id = input.product_id
  if (input.notes !== undefined) updates.notes = input.notes

  // Customers may only edit an appointment while it is still pending — once the
  // shop has confirmed (or it is completed/cancelled) it is locked.
  const { data, error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('แก้ไขไม่ได้ เนื่องจากการนัดนี้ถูกยืนยันหรือปิดไปแล้ว')
  }
}
