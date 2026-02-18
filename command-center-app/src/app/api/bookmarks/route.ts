import { NextRequest, NextResponse } from 'next/server'
import { getBookmarks, addBookmark, removeBookmark } from '@/lib/bookmarks'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const bookmarks = await getBookmarks()
    return NextResponse.json(bookmarks)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { entity_type, entity_id, label } = await request.json()

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      )
    }

    const bookmark = await addBookmark(entity_type, entity_id, label)
    if (!bookmark) {
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Create failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  }

  try {
    const success = await removeBookmark(id)
    if (!success) {
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
