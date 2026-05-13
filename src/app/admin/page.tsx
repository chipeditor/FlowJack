import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/db/supabase-server'
import { AdminDashboard } from './admin-dashboard'

const ADMIN_EMAILS = [
  'chip_e@mac.com',
  'chipeberhart@gmail.com',
]

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/dashboard')
  }

  const admin = await createAdminClient()

  const { data: projects } = await admin
    .from('projects')
    .select('id, title, logline, genre, status, created_at, updated_at, user_id')
    .order('updated_at', { ascending: false })

  const userIds = [...new Set((projects || []).map(p => p.user_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, tier, projects_count, created_at')
    .in('id', userIds.length > 0 ? userIds : ['none'])

  const { data: authUsers } = await admin.auth.admin.listUsers()

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))
  const emailMap = new Map(
    (authUsers?.users || []).map(u => [u.id, u.email ?? null])
  )

  const enrichedProjects = (projects || []).map(p => ({
    ...p,
    owner_name: profileMap.get(p.user_id)?.display_name ?? null,
    owner_email: emailMap.get(p.user_id) ?? null,
    owner_tier: profileMap.get(p.user_id)?.tier ?? 'free',
  }))

  const userStats = {
    totalUsers: authUsers?.users?.length ?? 0,
    totalProjects: projects?.length ?? 0,
  }

  return <AdminDashboard projects={enrichedProjects} stats={userStats} />
}
