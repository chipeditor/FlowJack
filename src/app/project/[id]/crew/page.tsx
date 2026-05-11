import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { CrewRosterView } from '@/components/project/crew-roster-view'

export default async function CrewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('crew_members')
    .select('*')
    .eq('project_id', id)
    .order('sort_order')

  const { data: scenes } = await supabase
    .from('scenes')
    .select('characters')
    .eq('project_id', id)

  const characters = Array.from(
    new Set((scenes || []).flatMap((s) => s.characters || []))
  ).sort()

  return (
    <CrewRosterView
      projectId={id}
      initialMembers={members || []}
      characters={characters}
    />
  )
}
