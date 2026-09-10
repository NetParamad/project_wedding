import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not read .env.local on its own. Node >= 20.12 exposes
// process.loadEnvFile; fall back silently if the file is absent (e.g. CI).
try {
  process.loadEnvFile('.env.local')
} catch {
  /* no .env.local — rely on the ambient environment */
}

/**
 * drizzle-kit config.
 *
 * The Supabase SQL migrations in supabase/migrations/ stay the source of truth.
 * Use drizzle-kit here for:
 *  - `npm run db:pull`   → introspect the live database into ./drizzle
 *  - `npm run db:studio` → browse data in the browser
 *  - `npm run db:generate` / `db:push` → if you decide to let Drizzle own DDL
 *
 * Point DATABASE_URL at the Session pooler / direct URI (port 5432) when running
 * these; the transaction pooler (6543) rejects the DDL drizzle-kit issues.
 */
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? '',
  },
  // Only manage the public schema; auth.* belongs to Supabase.
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
})
