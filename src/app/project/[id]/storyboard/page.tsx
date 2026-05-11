import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { StoryboardView } from '@/components/project/storyboard-view'

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: shots } = await supabase
    .from('shots')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const { data: storyboards } = await supabase
    .from('storyboards')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  return <StoryboardView projectId={id} shots={shots || []} storyboards={storyboards || []} />
}
