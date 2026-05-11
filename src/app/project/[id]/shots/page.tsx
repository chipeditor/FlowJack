import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { ShotsView } from '@/components/project/shots-view'

export default async function ShotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const { data: shots } = await supabase
    .from('shots')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  return <ShotsView projectId={id} scenes={scenes || []} shots={shots || []} />
}
