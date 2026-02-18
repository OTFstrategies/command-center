import { NextRequest, NextResponse } from 'next/server'
import { getUsageStats, getUsageSummary, recordUsage } from '@/lib/usage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('type') || undefined
  const period = searchParams.get('period') || undefined
  const summary = searchParams.get('summary') === 'true'

  try {
    if (summary) {
      const data = await getUsageSummary()
      return NextResponse.json(data)
    }
    const data = await getUsageStats(entityType, period)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { entity_type, entity_id, metric, value } = body

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      )
    }

    await recordUsage(entity_type, entity_id, metric || 'invocations', value || 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Record failed' },
      { status: 500 }
    )
  }
}
