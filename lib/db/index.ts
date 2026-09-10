import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/**
 * Server-only Drizzle client.
 *
 * This connects with the Postgres role in DATABASE_URL (typically the Supabase
 * `postgres` superuser or a dedicated role), so it BYPASSES Row Level Security.
 * Use it for trusted server-side work (admin actions, cron, migrations-adjacent
 * queries). For user-scoped reads/writes that must respect RLS, keep using the
 * Supabase client in lib/supabase/*.
 *
 * Connection string: Supabase Dashboard → Project Settings → Database.
 *  - App runtime (serverless): use the Transaction pooler URI (port 6543) and
 *    keep `prepare: false`.
 *  - drizzle-kit / migrations: use the Session pooler or direct URI (port 5432).
 */
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — add it to .env.local')
}

const globalForDb = globalThis as unknown as {
  __wedding_pg__?: ReturnType<typeof postgres>
}

const client =
  globalForDb.__wedding_pg__ ??
  postgres(connectionString, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    max: 1,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__wedding_pg__ = client
}

export const db = drizzle(client, { schema })

export { schema }
export * from './schema'
