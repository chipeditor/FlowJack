import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 400 })
    }

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...(project.metadata as Record<string, unknown>),
          screenplay_locked: true,
          screenplay_locked_at: new Date().toISOString(),
        },
      })
      .eq('id', projectId)

    return NextResponse.json({ locked: true })
  } catch (error) {
    console.error('Lock screenplay error:', error)
    return NextResponse.json({ error: 'Failed to lock screenplay' }, { status: 500 })
  }
}
