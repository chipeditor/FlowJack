import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { ScenesView } from '@/components/project/scenes-view'

export default async function ScenesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const { data: script } = await supabase
    .from('scripts')
    .select('id')
    .eq('project_id', id)
    .eq('is_active', true)
    .single()

  return <ScenesView projectId={id} scenes={scenes || []} hasScreenplay={!!script} />
}
