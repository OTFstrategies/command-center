'use client'

import { useState } from 'react'
import { Layers, Scroll } from 'lucide-react'

interface Tab {
  id: string
  label: string
  count?: number
}

type ViewMode = 'tabs' | 'scroll'

interface ProjectTabsProps {
  tabs: Tab[]
  children: Record<string, React.ReactNode>
}

export function ProjectTabs({ tabs, children }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview')
  const [viewMode, setViewMode] = useState<ViewMode>('tabs')

  if (viewMode === 'scroll') {
    return (
      <div>
        {/* Mode toggle */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Alle secties
          </span>
          <ViewModeToggle viewMode={viewMode} onToggle={setViewMode} />
        </div>

        {/* All sections stacked */}
        <div className="space-y-12">
          {tabs.map((tab) => (
            <section key={tab.id}>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-[10px] tabular-nums text-zinc-300 dark:text-zinc-600">
                    ({tab.count})
                  </span>
                )}
              </h2>
              {children[tab.id]}
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2.5 text-sm font-medium transition-colors relative
                ${activeTab === tab.id
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          ))}
        </div>
        <ViewModeToggle viewMode={viewMode} onToggle={setViewMode} />
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {children[activeTab]}
      </div>
    </div>
  )
}

function ViewModeToggle({
  viewMode,
  onToggle,
}: {
  viewMode: ViewMode
  onToggle: (mode: ViewMode) => void
}) {
  return (
    <div className="flex rounded-lg border border-zinc-200/50 p-0.5 dark:border-zinc-800/50">
      <button
        onClick={() => onToggle('tabs')}
        className={`rounded-md px-2 py-1 transition-colors ${
          viewMode === 'tabs'
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="Tabs"
      >
        <Layers className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onToggle('scroll')}
        className={`rounded-md px-2 py-1 transition-colors ${
          viewMode === 'scroll'
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="Scroll"
      >
        <Scroll className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
