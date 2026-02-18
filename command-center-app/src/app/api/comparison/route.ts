import { NextRequest, NextResponse } from 'next/server'
import { getProjectComparison } from '@/lib/comparison'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const a = searchParams.get('a')
  const b = searchParams.get('b')

  if (!a || !b) {
    return NextResponse.json({ error: 'Both a and b query params required' }, { status: 400 })
  }

  try {
    const data = await getProjectComparison(a, b)
    if (!data) {
      return NextResponse.json({ error: 'One or both projects not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Comparison failed' },
      { status: 500 }
    )
  }
}
