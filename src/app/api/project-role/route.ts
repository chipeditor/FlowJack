import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { getProjectRole, handleAuthError } from '@/lib/auth/check-permission'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const { role, permissions } = await getProjectRole(supabase, projectId)
    return NextResponse.json({ role, permissions })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Failed to get role' }, { status: 500 })
  }
}
