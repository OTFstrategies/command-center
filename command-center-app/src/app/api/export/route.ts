import { NextRequest, NextResponse } from 'next/server'
import { createSharedView, getSharedView } from '@/lib/export'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json({ error: 'type and data are required' }, { status: 400 })
    }

    const result = await createSharedView(type, data)
    if (!result) {
      return NextResponse.json({ error: 'Failed to create shared view' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt,
      shareUrl: `/shared/${result.token}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'token query param required' }, { status: 400 })
  }

  try {
    const view = await getSharedView(token)
    if (!view) {
      return NextResponse.json({ error: 'View not found or expired' }, { status: 404 })
    }
    return NextResponse.json(view)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
