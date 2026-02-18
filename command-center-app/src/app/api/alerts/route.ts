import { NextRequest, NextResponse } from 'next/server'
import { getAlerts, getAlertCounts, updateAlertStatus, bulkUpdateAlerts } from '@/lib/alerts'

// GET /api/alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const severity = searchParams.get('severity') || undefined
    const counts = searchParams.get('counts')

    if (counts === 'true') {
      const alertCounts = await getAlertCounts()
      return NextResponse.json(alertCounts)
    }

    const alerts = await getAlerts({ status, severity })
    return NextResponse.json({ alerts })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ids, status } = body as {
      id?: string
      ids?: string[]
      status: 'acknowledged' | 'resolved' | 'dismissed'
    }

    if (!status) {
      return NextResponse.json({ error: 'status required' }, { status: 400 })
    }

    if (ids && ids.length > 0) {
      await bulkUpdateAlerts(ids, status)
      return NextResponse.json({ success: true, updated: ids.length })
    } else if (id) {
      await updateAlertStatus(id, status)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'id or ids required' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
