/**
 * Drizzle schema — mirrors supabase/migrations/*.sql.
 *
 * The Supabase SQL migrations remain the source of truth for the database
 * (RLS policies, triggers, SECURITY DEFINER functions, exclusion constraints).
 * This file exists so application code gets a typed query builder. Keep it in
 * sync when you change a migration; `npm run db:pull` re-introspects a live
 * database into ./drizzle if you need to compare.
 */
import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  bigint,
  bigserial,
  boolean,
  check,
  date,
  integer,
  numeric,
  pgSchema,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*  auth.users (managed by Supabase Auth — referenced, never migrated here)   */
/* -------------------------------------------------------------------------- */

const authSchema = pgSchema('auth')

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
})

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

/* -------------------------------------------------------------------------- */
/*  profiles                                                                  */
/* -------------------------------------------------------------------------- */

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    phone: text('phone'),
    avatarUrl: text('avatar_url'),
    role: text('role').$type<'user' | 'admin'>().notNull().default('user'),
    ...timestamps,
  },
  (t) => [check('profiles_role_check', sql`${t.role} in ('user', 'admin')`)],
)

/* -------------------------------------------------------------------------- */
/*  categories                                                                */
/* -------------------------------------------------------------------------- */

export const categories = pgTable('categories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  parentId: bigint('parent_id', { mode: 'number' }).references(
    (): AnyPgColumn => categories.id,
    { onDelete: 'set null' },
  ),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

/* -------------------------------------------------------------------------- */
/*  products                                                                  */
/* -------------------------------------------------------------------------- */

export const products = pgTable('products', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  categoryId: bigint('category_id', { mode: 'number' }).references(
    () => categories.id,
    { onDelete: 'set null' },
  ),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  rentalPrice: numeric('rental_price', { precision: 10, scale: 2 }).notNull().default('0'),
  rentalDeposit: numeric('rental_deposit', { precision: 10, scale: 2 }).notNull().default('0'),
  isLocked: boolean('is_locked').notNull().default(false),
  lockedReason: text('locked_reason'),
  ...timestamps,
})

/* -------------------------------------------------------------------------- */
/*  product_images                                                            */
/* -------------------------------------------------------------------------- */

export const productImages = pgTable('product_images', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: bigint('product_id', { mode: 'number' })
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* -------------------------------------------------------------------------- */
/*  store_settings (single row, id = 1)                                       */
/* -------------------------------------------------------------------------- */

export const storeSettings = pgTable(
  'store_settings',
  {
    id: integer('id').primaryKey().default(1),
    storeName: text('store_name').notNull().default(''),
    logoUrl: text('logo_url'),
    promptpayNumber: text('promptpay_number'),
    promptpayQrUrl: text('promptpay_qr_url'),
    bankName: text('bank_name'),
    bankAccount: text('bank_account'),
    bankAccountName: text('bank_account_name'),
    theme: text('theme').notNull().default('zinc'),
    themeCustomColor: text('theme_custom_color'),
    businessHoursStart: time('business_hours_start').notNull().default('09:00'),
    businessHoursEnd: time('business_hours_end').notNull().default('17:00'),
    address: text('address'),
    mapUrl: text('map_url'),
    email: text('email'),
    phone: text('phone'),
    facebookUrl: text('facebook_url'),
    instagramUrl: text('instagram_url'),
    lineUrl: text('line_url'),
    tiktokUrl: text('tiktok_url'),
    youtubeUrl: text('youtube_url'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('store_settings_id_check', sql`${t.id} = 1`),
    check(
      'store_settings_theme_check',
      sql`${t.theme} in ('zinc','rose','blue','green','orange','violet','custom')`,
    ),
  ],
)

/* -------------------------------------------------------------------------- */
/*  product_date_locks                                                        */
/* -------------------------------------------------------------------------- */

export const productDateLocks = pgTable('product_date_locks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: bigint('product_id', { mode: 'number' })
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  lockStartDate: date('lock_start_date').notNull(),
  lockEndDate: date('lock_end_date').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => authUsers.id),
})

/* -------------------------------------------------------------------------- */
/*  rentals                                                                   */
/* -------------------------------------------------------------------------- */

export const rentals = pgTable(
  'rentals',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id),
    productId: bigint('product_id', { mode: 'number' })
      .notNull()
      .references(() => products.id),
    appointmentId: bigint('appointment_id', { mode: 'number' }),
    phone: text('phone'),
    rentalStartDate: date('rental_start_date').notNull(),
    rentalEndDate: date('rental_end_date').notNull(),
    rentalPrice: numeric('rental_price', { precision: 10, scale: 2 }).notNull().default('0'),
    depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    status: text('status')
      .$type<'pending' | 'active' | 'returned' | 'late' | 'cancelled'>()
      .notNull()
      .default('pending'),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    returnCondition: text('return_condition'),
    returnPenalty: numeric('return_penalty', { precision: 10, scale: 2 }).default('0'),
    returnNotes: text('return_notes'),
    notes: text('notes'),
    deliveryName: text('delivery_name'),
    deliveryAddress: text('delivery_address'),
    ...timestamps,
  },
  (t) => [
    check(
      'rentals_status_check',
      sql`${t.status} in ('pending', 'active', 'returned', 'late', 'cancelled')`,
    ),
  ],
)

/* -------------------------------------------------------------------------- */
/*  appointment_services                                                      */
/* -------------------------------------------------------------------------- */

export const appointmentServices = pgTable(
  'appointment_services',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    type: text('type').$type<'try_on' | 'consultation'>().notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    check('appointment_services_type_check', sql`${t.type} in ('try_on', 'consultation')`),
  ],
)

/* -------------------------------------------------------------------------- */
/*  appointments                                                              */
/* -------------------------------------------------------------------------- */

export const appointments = pgTable(
  'appointments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id),
    serviceId: bigint('service_id', { mode: 'number' })
      .notNull()
      .references(() => appointmentServices.id),
    productId: bigint('product_id', { mode: 'number' }).references(() => products.id, {
      onDelete: 'set null',
    }),
    appointmentDate: date('appointment_date').notNull(),
    timeSlot: time('time_slot').notNull(),
    endTime: time('end_time').notNull(),
    phone: text('phone'),
    notes: text('notes'),
    status: text('status')
      .$type<'pending' | 'confirmed' | 'completed' | 'cancelled'>()
      .notNull()
      .default('pending'),
    isRental: boolean('is_rental').notNull().default(false),
    rentalId: bigint('rental_id', { mode: 'number' }).references(() => rentals.id, {
      onDelete: 'set null',
    }),
    adminNotes: text('admin_notes'),
    tryOnPrice: numeric('try_on_price', { precision: 10, scale: 2 }),
    tryOnOnly: boolean('try_on_only').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    check(
      'appointments_status_check',
      sql`${t.status} in ('pending', 'confirmed', 'completed', 'cancelled')`,
    ),
  ],
)

/* -------------------------------------------------------------------------- */
/*  notifications                                                             */
/* -------------------------------------------------------------------------- */

export const notifications = pgTable(
  'notifications',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id),
    type: text('type')
      .$type<'general' | 'appointment_update' | 'order_update' | 'payment_confirmed'>()
      .notNull()
      .default('general'),
    title: text('title').notNull(),
    message: text('message'),
    link: text('link'),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'notifications_type_check',
      sql`${t.type} in ('general','appointment_update','order_update','payment_confirmed')`,
    ),
  ],
)

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                            */
/* -------------------------------------------------------------------------- */

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert
export type StoreSettings = typeof storeSettings.$inferSelect
export type NewStoreSettings = typeof storeSettings.$inferInsert
export type ProductDateLock = typeof productDateLocks.$inferSelect
export type NewProductDateLock = typeof productDateLocks.$inferInsert
export type Rental = typeof rentals.$inferSelect
export type NewRental = typeof rentals.$inferInsert
export type AppointmentService = typeof appointmentServices.$inferSelect
export type NewAppointmentService = typeof appointmentServices.$inferInsert
export type Appointment = typeof appointments.$inferSelect
export type NewAppointment = typeof appointments.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
