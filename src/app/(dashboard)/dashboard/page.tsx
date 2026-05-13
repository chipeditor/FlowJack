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

  const { data: memberships } = await supabase
    .from('project_members')
    .select('role, project:projects(id, title, logline, genre, status, updated_at)')
    .eq('user_id', user?.id ?? '')
    .order('joined_at', { ascending: false })
    .limit(10)

  const sharedProjects = (memberships || [])
    .filter(m => m.project)
    .map(m => {
      const p = m.project as unknown as { id: string; title: string; logline: string | null; genre: string | null; status: string; updated_at: string }
      return { ...p, memberRole: m.role }
    })

  return <DashboardContent projects={projects || []} sharedProjects={sharedProjects} />
}
