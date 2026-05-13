import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import { ProjectSettings } from '@/components/project/project-settings'
import { CollaboratorsPanel } from '@/components/project/collaborators-panel'

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const isOwner = project.user_id === user?.id

  return (
    <div className="space-y-12 max-w-2xl">
      <ProjectSettings project={project} />
      <CollaboratorsPanel projectId={id} isOwner={isOwner} />
    </div>
  )
}
