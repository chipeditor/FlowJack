'use client'

import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExportPDFButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <FileDown className="w-4 h-4" />
      Create PDF
    </Button>
  )
}
