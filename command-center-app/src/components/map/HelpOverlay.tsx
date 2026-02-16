'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface HelpOverlayProps {
  onClose: () => void
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Over de Overzichtskaart
        </h2>

        <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Dit is een visuele kaart van je hele AI-setup. Je ziet hier alle projecten, agents,
          commands, skills en andere onderdelen, en hoe ze met elkaar verbonden zijn.
        </p>

        {/* Legend */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Vormen
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <LegendItem shape="circle" label="Project / Prompt" />
            <LegendItem shape="hexagon" label="Agent" />
            <LegendItem shape="square" label="Command" />
            <LegendItem shape="diamond" label="Skill" />
            <LegendItem shape="rounded" label="Plugin" />
            <LegendItem shape="triangle" label="API / Dienst" />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Lijnen
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="h-0.5 w-8 bg-zinc-500" />
              <span>Directe koppeling (bevat, hoort bij)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="h-0.5 w-8 border-b border-dashed border-zinc-400" />
              <span>Zwakke relatie (gerelateerd aan)</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Bediening
          </h3>
          <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <li><strong>Klik</strong> op een onderdeel om details te zien</li>
            <li><strong>Scroll</strong> om in/uit te zoomen</li>
            <li><strong>Sleep</strong> om te verschuiven</li>
            <li><strong>Zoek</strong> om specifieke items te vinden</li>
          </ul>
        </div>
      </motion.div>
    </>
  )
}

function LegendItem({ shape, label }: { shape: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
      <div className="flex h-5 w-5 items-center justify-center">
        <ShapeIcon shape={shape} />
      </div>
      <span>{label}</span>
    </div>
  )
}

function ShapeIcon({ shape }: { shape: string }) {
  const cls = 'h-3 w-3 border border-zinc-400'
  switch (shape) {
    case 'circle':
      return <div className={`${cls} rounded-full bg-zinc-300 dark:bg-zinc-600`} />
    case 'hexagon':
      return <div className={`${cls} rotate-45 bg-zinc-400 dark:bg-zinc-500`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    case 'square':
      return <div className={`${cls} bg-zinc-300 dark:bg-zinc-600`} />
    case 'diamond':
      return <div className={`${cls} rotate-45 bg-zinc-400 dark:bg-zinc-500`} />
    case 'rounded':
      return <div className={`${cls} rounded bg-zinc-500 dark:bg-zinc-400`} />
    case 'triangle':
      return <div className="h-3 w-3 border-b-[12px] border-l-[6px] border-r-[6px] border-b-zinc-400 border-l-transparent border-r-transparent dark:border-b-zinc-500" />
    default:
      return <div className={`${cls} rounded-full bg-zinc-300`} />
  }
}
