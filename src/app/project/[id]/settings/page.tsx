import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import { ProjectSettings } from '@/components/project/project-settings'

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  return <ProjectSettings project={project} />
}
