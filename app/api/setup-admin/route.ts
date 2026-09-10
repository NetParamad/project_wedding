import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // claim_first_admin() takes a transaction-level advisory lock and re-checks
  // that no admin exists, so concurrent callers cannot both succeed.
  const { error } = await supabase.rpc('claim_first_admin')

  if (error) {
    const alreadyExists = error.message.includes('admin already exists')
    return NextResponse.json(
      { error: alreadyExists ? 'An admin already exists' : error.message },
      { status: alreadyExists ? 403 : 500 },
    )
  }

  return NextResponse.json({ success: true })
}
