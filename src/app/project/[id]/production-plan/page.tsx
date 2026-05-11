import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { ProductionPlanView } from '@/components/project/production-plan-view'

export default async function ProductionPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: plan } = await supabase
    .from('production_plans')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: script } = await supabase
    .from('scripts')
    .select('id')
    .eq('project_id', id)
    .eq('is_active', true)
    .single()

  return <ProductionPlanView projectId={id} plan={plan} hasScreenplay={!!script} />
}
