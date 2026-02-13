'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  count?: number
}

interface ProjectTabsProps {
  tabs: Tab[]
  children: Record<string, React.ReactNode>
}

export function ProjectTabs({ tabs, children }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
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

      {/* Tab content */}
      <div className="mt-6">
        {children[activeTab]}
      </div>
    </div>
  )
}
