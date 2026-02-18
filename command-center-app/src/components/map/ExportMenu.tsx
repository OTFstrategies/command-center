'use client'

import { useState } from 'react'
import { Image, Link, Check, Loader2 } from 'lucide-react'
import type { MapData } from '@/types'

interface ExportMenuProps {
  data: MapData
}

export default function ExportMenu({ data }: ExportMenuProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const createShareLink = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'map',
          data: {
            nodes: data.nodes.length,
            edges: data.edges.length,
            clusters: data.clusters.map((c) => ({ name: c.name, memberCount: c.memberCount })),
            insights: data.insights.length,
            generatedAt: new Date().toISOString(),
          },
        }),
      })
      const result = await res.json()
      if (result.success) {
        const fullUrl = `${window.location.origin}${result.shareUrl}`
        await navigator.clipboard.writeText(fullUrl)
        setStatus('success')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const exportPng = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `intelligence-map-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-1">
      <button
        onClick={createShareLink}
        disabled={status === 'loading'}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {status === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />
        ) : status === 'success' ? (
          <Check className="h-3.5 w-3.5 text-zinc-400" />
        ) : (
          <Link className="h-3.5 w-3.5 text-zinc-400" />
        )}
        <span className="text-zinc-600 dark:text-zinc-300">
          {status === 'success' ? 'Link gekopieerd!' : 'Deelbare link (24u)'}
        </span>
      </button>
      <button
        onClick={exportPng}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Image className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-zinc-600 dark:text-zinc-300">Export als PNG</span>
      </button>
    </div>
  )
}
