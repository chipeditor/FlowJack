import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import { ProjectOverview } from '@/components/project/project-overview'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, version, is_active, created_at')
    .eq('project_id', id)
    .eq('is_active', true)

  const { count: sceneCount } = await supabase
    .from('scenes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  const { count: shotCount } = await supabase
    .from('shots')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  return (
    <ProjectOverview
      project={project}
      hasScreenplay={!!scripts && scripts.length > 0}
      sceneCount={sceneCount || 0}
      shotCount={shotCount || 0}
    />
  )
}
