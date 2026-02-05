import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask } from '@/lib/tasks'

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project')
  const tasks = await getTasks(project || undefined)
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.project || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: project and title' },
        { status: 400 }
      )
    }

    const task = await createTask({
      project: body.project,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      position: body.position,
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    return NextResponse.json(task, { status: 201 })
  } catch (e) {
    console.error('Error in POST /api/tasks:', e)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
