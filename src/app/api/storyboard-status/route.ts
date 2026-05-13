import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { getProjectRole, handleAuthError } from '@/lib/auth/check-permission'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    await getProjectRole(supabase, projectId)

    const { data: storyboards } = await supabase
      .from('storyboards')
      .select('id, shot_id, image_url, thumbnail_url, status')
      .eq('project_id', projectId)

    return NextResponse.json({ storyboards: storyboards || [] })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
