import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Serves objects from the public "store-assets" bucket (logo, PromptPay QR).
// The path is attacker-controlled, so keep it strictly to a simple relative key.
const VALID_KEY = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return new NextResponse('Missing path', { status: 400 })
  }

  if (path.length > 256 || path.includes('..') || !VALID_KEY.test(path)) {
    return new NextResponse('Invalid path', { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('store-assets')
    .download(path)

  if (error || !data) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(data, {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
