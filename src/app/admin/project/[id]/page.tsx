import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { AdminProjectView } from './admin-project-view'

const ADMIN_EMAILS = [
  'chip_e@mac.com',
  'chipeberhart@gmail.com',
]

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/dashboard')
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: project } = await admin
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: authUsers } = await admin.auth.admin.listUsers()
  const ownerAuth = authUsers?.users?.find(u => u.id === project.user_id)

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', project.user_id)
    .single()

  const [
    { data: scripts },
    { data: scenes },
    { count: shotCount },
    { data: characters },
    { count: creativeBriefCount },
    { count: shootPlanCount },
    { count: crewCount },
  ] = await Promise.all([
    admin.from('scripts').select('id, version, is_active, content, word_count, estimated_runtime_seconds').eq('project_id', id).eq('is_active', true),
    admin.from('scenes').select('id, scene_number, heading, description, characters, mood, interior_exterior, time_of_day').eq('project_id', id).order('sort_order'),
    admin.from('shots').select('*', { count: 'exact', head: true }).eq('project_id', id),
    admin.from('characters').select('id, name, description, physical_traits, reference_image_url').eq('project_id', id).order('sort_order'),
    admin.from('production_plans').select('*', { count: 'exact', head: true }).eq('project_id', id),
    admin.from('shoot_plans').select('*', { count: 'exact', head: true }).eq('project_id', id),
    admin.from('crew_members').select('*', { count: 'exact', head: true }).eq('project_id', id),
  ])

  const activeScript = scripts?.[0] ?? null

  return (
    <AdminProjectView
      project={project}
      owner={{
        name: profile?.display_name ?? 'Unnamed',
        email: ownerAuth?.email ?? 'unknown',
        tier: profile?.tier ?? 'free',
      }}
      screenplay={activeScript ? {
        wordCount: activeScript.word_count ?? 0,
        estimatedRuntime: activeScript.estimated_runtime_seconds ?? 0,
        preview: (activeScript.content ?? '').slice(0, 2000),
      } : null}
      scenes={(scenes ?? []).map(s => ({
        scene_number: s.scene_number,
        heading: s.heading,
        description: s.description,
        characters: s.characters,
        mood: s.mood,
        interior_exterior: s.interior_exterior,
        time_of_day: s.time_of_day,
      }))}
      characters={(characters ?? []).map(c => ({
        name: c.name,
        description: c.description,
        reference_image_url: c.reference_image_url,
      }))}
      stats={{
        shotCount: shotCount ?? 0,
        hasCreativeBrief: (creativeBriefCount ?? 0) > 0,
        hasShootPlan: (shootPlanCount ?? 0) > 0,
        crewCount: crewCount ?? 0,
      }}
    />
  )
}
