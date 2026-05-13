import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import { ProjectSidebar } from '@/components/project/project-sidebar'
import { ExportPDFButton } from '@/components/project/export-pdf-button'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  return (
    <div className="min-h-screen bg-canvas flex">
      <ProjectSidebar project={project} />
      <main className="flex-1 pl-[260px]">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex justify-end mb-4 print:hidden">
            <ExportPDFButton />
          </div>
          <div id="print-content">{children}</div>
        </div>
      </main>
    </div>
  )
}
