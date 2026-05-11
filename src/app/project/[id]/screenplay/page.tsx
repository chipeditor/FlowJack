import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { ScreenplayView } from '@/components/project/screenplay-view'

export default async function ScreenplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, logline, genre, tone, duration_target, metadata')
    .eq('id', id)
    .single()

  const { data: script } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', id)
    .eq('is_active', true)
    .single()

  return <ScreenplayView project={project!} script={script} />
}
