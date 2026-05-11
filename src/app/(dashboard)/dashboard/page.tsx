import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('updated_at', { ascending: false })
    .limit(10)

  return <DashboardContent projects={projects || []} />
}
