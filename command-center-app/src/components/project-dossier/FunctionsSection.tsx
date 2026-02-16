'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap } from 'lucide-react'

interface Capability {
  category: string
  label: string
  items: { name: string; type: string; description?: string | null }[]
}

interface FunctionsSectionProps {
  capabilities: Capability[]
}

const typeLabels: Record<string, string> = {
  command: 'Command',
  agent: 'Agent',
  skill: 'Skill',
  prompt: 'Prompt',
  api: 'API',
  instruction: 'Instructie',
  symbol: 'Code',
}

export function FunctionsSection({ capabilities }: FunctionsSectionProps) {
  if (capabilities.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Geen functies gedetecteerd voor dit project.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {capabilities.map((cap) => (
        <CapabilityGroup key={cap.category} capability={cap} />
      ))}
    </div>
  )
}

function CapabilityGroup({ capability }: { capability: Capability }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-200/50 bg-white/60 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
        )}
        <Zap className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {capability.label}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {capability.items.length}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-200/50 px-4 pb-4 dark:border-zinc-800/50">
          <ul className="mt-2 space-y-1">
            {capability.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
              >
                <span className="truncate text-zinc-600 dark:text-zinc-300">
                  {item.name}
                </span>
                <span className="ml-auto shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {typeLabels[item.type] || item.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
