import { NextRequest, NextResponse } from 'next/server'
import { getCosts, getCostSummary, upsertCost } from '@/lib/costs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || undefined
  const summary = searchParams.get('summary') === 'true'

  try {
    if (summary) {
      const data = await getCostSummary()
      return NextResponse.json(data)
    }
    const data = await getCosts(period)
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
    const { service, project, plan, monthly_cost, usage_metric, usage_value, period } = body

    if (!service || !period) {
      return NextResponse.json({ error: 'service and period are required' }, { status: 400 })
    }

    await upsertCost({
      service,
      project: project || null,
      plan: plan || null,
      monthly_cost: monthly_cost || 0,
      usage_metric: usage_metric || null,
      usage_value: usage_value || 0,
      period,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upsert failed' },
      { status: 500 }
    )
  }
}
