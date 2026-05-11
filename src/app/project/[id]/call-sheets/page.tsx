import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { CallSheetView } from '@/components/project/call-sheet-view'

export default async function CallSheetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: shootPlan } = await supabase
    .from('shoot_plans')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: callSheets } = await supabase
    .from('call_sheets')
    .select('*')
    .eq('project_id', id)
    .order('day_number')

  const { data: keyContactMembers } = await supabase
    .from('crew_members')
    .select('name, role, phone')
    .eq('project_id', id)
    .eq('is_key_contact', true)
    .order('sort_order')

  if (!shootPlan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-text-primary">Call Sheets</h1>
        <div className="panel p-8 text-center">
          <p className="text-xs text-text-tertiary">
            Generate a Production Plan first to create call sheets.
          </p>
        </div>
      </div>
    )
  }

  return (
    <CallSheetView
      projectId={id}
      shootPlan={shootPlan}
      callSheets={callSheets || []}
      keyContacts={keyContactMembers || []}
    />
  )
}
