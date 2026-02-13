'use client'

import { useState } from 'react'
import { FileCode, ChevronRight, Lock, Unlock, Zap } from 'lucide-react'
import type { CodeSymbol } from '@/types'

interface CodeTabProps {
  symbols: CodeSymbol[]
}

const kindColors: Record<string, string> = {
  function: 'text-zinc-700 dark:text-zinc-300',
  class: 'text-zinc-600 dark:text-zinc-200',
  interface: 'text-zinc-500 dark:text-zinc-400',
  type: 'text-zinc-500 dark:text-zinc-400',
  enum: 'text-zinc-500 dark:text-zinc-400',
  variable: 'text-zinc-400 dark:text-zinc-500',
  method: 'text-zinc-600 dark:text-zinc-300',
  property: 'text-zinc-400 dark:text-zinc-500',
}

const kindLabels: Record<string, string> = {
  function: 'fn',
  class: 'class',
  interface: 'iface',
  type: 'type',
  enum: 'enum',
  variable: 'var',
  method: 'method',
  property: 'prop',
}

export function CodeTab({ symbols }: CodeTabProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState<string | null>(null)

  if (symbols.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <FileCode className="h-8 w-8 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
        <p>No code analysis data yet.</p>
        <p className="text-sm mt-1">Run <code className="font-mono text-zinc-500">analyze_project</code> via MCP to populate.</p>
      </div>
    )
  }

  // Group symbols by file
  const fileGroups = new Map<string, CodeSymbol[]>()
  for (const sym of symbols) {
    if (kindFilter && sym.kind !== kindFilter) continue
    const existing = fileGroups.get(sym.file_path) || []
    existing.push(sym)
    fileGroups.set(sym.file_path, existing)
  }

  // Kind summary for filter chips
  const kindCounts = new Map<string, number>()
  for (const sym of symbols) {
    kindCounts.set(sym.kind, (kindCounts.get(sym.kind) || 0) + 1)
  }

  return (
    <div>
      {/* Kind filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setKindFilter(null)}
          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
            !kindFilter
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          All ({symbols.length})
        </button>
        {Array.from(kindCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([kind, count]) => (
            <button
              key={kind}
              onClick={() => setKindFilter(kindFilter === kind ? null : kind)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                kindFilter === kind
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {kind} ({count})
            </button>
          ))}
      </div>

      {/* File tree */}
      <div className="space-y-1">
        {Array.from(fileGroups.entries()).map(([filePath, fileSymbols]) => (
          <div key={filePath}>
            <button
              onClick={() => setExpandedFile(expandedFile === filePath ? null : filePath)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/30 dark:hover:bg-zinc-800/20 transition-colors text-left"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${expandedFile === filePath ? 'rotate-90' : ''}`}
                strokeWidth={1.5}
              />
              <FileCode className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <span className="text-sm font-mono text-zinc-600 dark:text-zinc-300 truncate">
                {filePath}
              </span>
              <span className="ml-auto text-xs text-zinc-400 tabular-nums shrink-0">
                {fileSymbols.length}
              </span>
            </button>

            {expandedFile === filePath && (
              <div className="ml-6 pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-0.5 mb-2">
                {fileSymbols.map((sym) => (
                  <div
                    key={sym.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/20 dark:hover:bg-zinc-800/10"
                  >
                    <span className={`text-xs font-mono w-12 shrink-0 ${kindColors[sym.kind] || 'text-zinc-400'}`}>
                      {kindLabels[sym.kind] || sym.kind}
                    </span>
                    <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      {sym.name}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      {sym.is_async && (
                        <Zap className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
                      )}
                      {sym.exported ? (
                        <Unlock className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
                      ) : (
                        <Lock className="h-3 w-3 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                      )}
                      <span className="text-xs text-zinc-400 tabular-nums">
                        L{sym.line_start}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
