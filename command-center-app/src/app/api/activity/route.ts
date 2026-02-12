import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase not configured')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || undefined
  const period = (searchParams.get('period') as 'today' | 'week' | 'month' | 'all') || undefined
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const { getActivityLog } = await import('@/lib/registry')
  const result = await getActivityLog({ type, period, limit, offset })

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  // Auth check
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || !process.env.SYNC_API_KEY || apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { item_type, item_name, action, details } = body

  if (!item_type || !item_name || !action) {
    return NextResponse.json({ error: 'Missing required fields: item_type, item_name, action' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('activity_log').insert({
    item_type,
    item_name,
    action,
    details: details || {},
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
