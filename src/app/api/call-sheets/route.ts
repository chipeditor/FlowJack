import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { requireProjectPermission, handleAuthError } from '@/lib/auth/check-permission'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id, projectId, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (projectId) await requireProjectPermission(supabase, projectId, 'call_sheets', 'edit')

    const { data, error } = await supabase
      .from('call_sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ callSheet: data })
  } catch (error) {
    const authResp = handleAuthError(error)
    if (authResp) return authResp
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
