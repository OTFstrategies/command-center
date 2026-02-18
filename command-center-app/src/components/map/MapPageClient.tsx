'use client'

import { useState, useCallback, useEffect } from 'react'
import { Eye, Network, Clock, GitCompare, HelpCircle, Share2 } from 'lucide-react'
import type { MapData, MapNode } from '@/types'
import type { CostSummary } from '@/lib/costs'
import type { UsageSummary } from '@/lib/usage'
import type { TimelineDay } from '@/lib/timeline'
import type { Bookmark } from '@/lib/bookmarks'
import { CockpitView } from './CockpitView'
import { FilterBar } from './FilterBar'
import { InsightsPanel } from './InsightsPanel'
import { DetailPanel } from './DetailPanel'
import { HelpOverlay } from './HelpOverlay'
import { SinceLastVisit } from './SinceLastVisit'
import { RiskAnalysis } from './RiskAnalysis'
import { QuickActions } from './QuickActions'
import CostsDashboard from './CostsDashboard'
import UsagePanel from './UsagePanel'
import TimelineView from './TimelineView'
import ComparisonView from './ComparisonView'
import BookmarksBar from './BookmarksBar'
import ExportMenu from './ExportMenu'
import dynamic from 'next/dynamic'

// Dynamic import for react-force-graph-2d (no SSR)
const FullGraphView = dynamic(() => import('./FullGraphView').then((m) => m.FullGraphView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-2xl border border-zinc-200/50 bg-white/50 dark:border-zinc-800/50 dark:bg-zinc-900/50">
      <div className="text-zinc-400">Kaart laden...</div>
    </div>
  ),
})

type ViewMode = 'cockpit' | 'graph' | 'timeline' | 'compare'

interface MapPageClientProps {
  data: MapData
  costSummary?: CostSummary
  usageSummary?: UsageSummary
  timelineDays?: TimelineDay[]
  projectSlugs?: { slug: string; name: string }[]
  bookmarks?: Bookmark[]
}

export function MapPageClient({
  data,
  costSummary,
  usageSummary,
  timelineDays,
  projectSlugs,
  bookmarks: initialBookmarks,
}: MapPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cockpit')
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null)
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set())
  const [showHelp, setShowHelp] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [bookmarks, setBookmarks] = useState(initialBookmarks || [])
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    cluster: 'all',
  })

  // Filter nodes and edges
  const filteredData = useCallback(() => {
    let nodes = data.nodes
    let edges = data.edges

    if (filters.search) {
      const q = filters.search.toLowerCase()
      nodes = nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q)
      )
    }

    if (filters.type !== 'all') {
      nodes = nodes.filter((n) => n.type === filters.type)
    }

    if (filters.cluster !== 'all') {
      nodes = nodes.filter((n) => n.cluster === filters.cluster)
    }

    // Filter edges to only include visible nodes
    const nodeIds = new Set(nodes.map((n) => n.id))
    edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

    return { ...data, nodes, edges }
  }, [data, filters])

  const handleNodeClick = useCallback(
    (node: MapNode) => {
      setSelectedNode(node)
      // Highlight connected nodes
      const connected = new Set<string>()
      connected.add(node.id)
      for (const edge of data.edges) {
        if (edge.source === node.id) connected.add(edge.target)
        if (edge.target === node.id) connected.add(edge.source)
      }
      setHighlightedItems(connected)
    },
    [data.edges]
  )

  const handleInsightClick = useCallback(
    (affectedItems: string[]) => {
      setHighlightedItems(new Set(affectedItems.map((i) => `registry:${i}`)))
    },
    []
  )

  const handleBookmarkSelect = useCallback(
    (entityId: string) => {
      const node = data.nodes.find((n) => n.id === entityId || n.name === entityId)
      if (node) handleNodeClick(node)
    },
    [data.nodes, handleNodeClick]
  )

  const handleBookmarkRemove = useCallback(async (bookmarkId: string) => {
    try {
      await fetch(`/api/bookmarks?id=${bookmarkId}`, { method: 'DELETE' })
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId))
    } catch {
      // silently fail
    }
  }, [])

  // Unique types and clusters for filter dropdowns
  const types = [...new Set(data.nodes.map((n) => n.type))].sort()
  const clusters = data.clusters.map((c) => ({ slug: c.slug, name: c.name }))

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Overzichtskaart
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data.nodes.length} onderdelen &middot; {data.edges.length} koppelingen &middot;{' '}
            {data.clusters.length} groepen
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl border border-zinc-200/50 bg-white/50 p-1 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <button
              onClick={() => setViewMode('cockpit')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'cockpit'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              <Eye className="h-4 w-4" />
              Cockpit
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'graph'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              <Network className="h-4 w-4" />
              Kaart
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              <Clock className="h-4 w-4" />
              Tijdlijn
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'compare'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              <GitCompare className="h-4 w-4" />
              Vergelijk
            </button>
          </div>

          {/* Export button */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
              aria-label="Export"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-zinc-200/50 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/95">
                <ExportMenu data={data} />
              </div>
            )}
          </div>

          {/* Help button */}
          <button
            onClick={() => setShowHelp(true)}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Since last visit banner */}
      <SinceLastVisit />

      {/* Bookmarks bar */}
      <BookmarksBar
        bookmarks={bookmarks}
        onSelect={handleBookmarkSelect}
        onRemove={handleBookmarkRemove}
      />

      {/* Filter bar (only in graph mode) */}
      {viewMode === 'graph' && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          types={types}
          clusters={clusters}
        />
      )}

      {/* Main content area */}
      {viewMode === 'timeline' ? (
        <TimelineView days={timelineDays || []} />
      ) : viewMode === 'compare' ? (
        <ComparisonView projects={projectSlugs || []} />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Map/Cockpit */}
          <div className="flex-1">
            {viewMode === 'cockpit' ? (
              <CockpitView
                clusters={data.clusters}
                insights={data.insights}
                nodeCount={data.nodes.length}
                edgeCount={data.edges.length}
                onClusterClick={(slug) => {
                  setFilters({ search: '', type: 'all', cluster: slug })
                  setViewMode('graph')
                }}
              />
            ) : (
              <FullGraphView
                data={filteredData()}
                highlightedItems={highlightedItems}
                onNodeClick={handleNodeClick}
              />
            )}
          </div>

          {/* Side panels */}
          <div className="w-full space-y-4 lg:w-80">
            {/* Costs dashboard */}
            {costSummary && <CostsDashboard summary={costSummary} />}

            {/* Usage panel */}
            {usageSummary && <UsagePanel summary={usageSummary} />}

            {/* Insights panel */}
            <InsightsPanel
              insights={data.insights}
              onInsightClick={handleInsightClick}
            />

            {/* Risk analysis */}
            <RiskAnalysis nodes={data.nodes} edges={data.edges} />
          </div>
        </div>
      )}

      {/* Detail panel (slide-in) */}
      {selectedNode && (
        <DetailPanel
          node={selectedNode}
          edges={data.edges}
          nodes={data.nodes}
          onClose={() => {
            setSelectedNode(null)
            setHighlightedItems(new Set())
          }}
        />
      )}

      {/* Help overlay */}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}

      {/* Quick actions FAB */}
      <QuickActions />

      {/* Close export menu on click outside */}
      {showExport && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
