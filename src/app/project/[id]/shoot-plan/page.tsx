import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { ShootPlanView } from '@/components/project/shoot-plan-view'

export default async function ShootPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: plan } = await supabase
    .from('shoot_plans')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { count: sceneCount } = await supabase
    .from('scenes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  const { count: shotCount } = await supabase
    .from('shots')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  return (
    <ShootPlanView
      projectId={id}
      plan={plan}
      hasScenes={(sceneCount || 0) > 0}
      hasShots={(shotCount || 0) > 0}
    />
  )
}
