'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ScriptDropZoneProps {
  onContentReady: (content: string, wordCount: number, format: string) => void
  onClear: () => void
  hasContent: boolean
  wordCount: number
  format: string
}

export function ScriptDropZone({ onContentReady, onClear, hasContent, wordCount, format }: ScriptDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setParsing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/projects/import-script', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to parse file')
        return
      }
      onContentReady(data.content, data.wordCount, data.format)
    } catch {
      setError('Failed to upload file')
    } finally {
      setParsing(false)
    }
  }, [onContentReady])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handlePasteSubmit() {
    const trimmed = pasteText.trim()
    if (trimmed.length < 100) {
      setError('Script content is too short')
      return
    }
    const wc = trimmed.split(/\s+/).length
    onContentReady(trimmed, wc, 'pasted')
  }

  if (hasContent) {
    return (
      <div className="flex items-center justify-between p-4 bg-accent/5 border border-accent/20 rounded-xl">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent" />
          <div>
            <p className="text-sm font-medium text-text-primary">Screenplay imported</p>
            <p className="text-2xs text-text-tertiary">
              {wordCount.toLocaleString()} words · {format.toUpperCase()} · ~{Math.round(wordCount / 150)} min runtime
            </p>
          </div>
        </div>
        <button onClick={onClear} className="text-text-tertiary hover:text-text-primary cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (pasteMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Paste Screenplay
          </label>
          <button
            type="button"
            onClick={() => { setPasteMode(false); setError(null) }}
            className="text-2xs text-accent hover:underline cursor-pointer"
          >
            Upload file instead
          </button>
        </div>
        <Textarea
          placeholder="Paste your screenplay text here..."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          className="min-h-[160px] font-mono text-xs"
        />
        {pasteText.trim().length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-2xs text-text-tertiary">
              {pasteText.trim().split(/\s+/).length.toLocaleString()} words
            </span>
            <Button type="button" size="sm" onClick={handlePasteSubmit}>
              Use This Script
            </Button>
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        Screenplay
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragging
            ? 'border-accent bg-accent/10'
            : 'border-surface-border hover:border-accent/50 hover:bg-surface-hover'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.fountain"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          className="hidden"
        />
        {parsing ? (
          <>
            <svg className="animate-spin h-6 w-6 text-accent mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-xs text-text-secondary">Parsing screenplay...</p>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-text-tertiary mb-2" />
            <p className="text-sm text-text-primary font-medium">Drop your screenplay here</p>
            <p className="text-2xs text-text-tertiary mt-1">PDF, DOCX, or TXT (max 2MB)</p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setPasteMode(true); setError(null) }}
        className="flex items-center gap-1.5 text-2xs text-accent hover:underline cursor-pointer"
      >
        <Type className="w-3 h-3" />
        Paste text instead
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
