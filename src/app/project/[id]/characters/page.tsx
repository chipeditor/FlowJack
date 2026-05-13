import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { CharactersView } from '@/components/project/characters-view'

export default async function CharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('project_id', id)
    .order('sort_order')

  return <CharactersView projectId={id} initialCharacters={characters || []} />
}
