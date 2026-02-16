'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChangeItem {
  id: string
  item_type: string
  item_name: string
  action: string
  created_at: string
}

const STORAGE_KEY = 'cc-map-last-visit'

const actionLabels: Record<string, string> = {
  created: 'Nieuw',
  synced: 'Gesynchroniseerd',
  updated: 'Gewijzigd',
  deleted: 'Verwijderd',
  used: 'Gebruikt',
}

const groupLabels: Record<string, string> = {
  new: 'Nieuw',
  changed: 'Gewijzigd',
  other: 'Overig',
}

function groupChanges(items: ChangeItem[]) {
  const groups: Record<string, ChangeItem[]> = {
    new: [],
    changed: [],
    other: [],
  }

  for (const item of items) {
    if (item.action === 'created') {
      groups.new.push(item)
    } else if (item.action === 'updated' || item.action === 'synced') {
      groups.changed.push(item)
    } else {
      groups.other.push(item)
    }
  }

  return groups
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m geleden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}u geleden`
  const days = Math.floor(hours / 24)
  return `${days}d geleden`
}

export function SinceLastVisit() {
  const [changes, setChanges] = useState<ChangeItem[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChanges() {
      try {
        const lastVisit = localStorage.getItem(STORAGE_KEY)

        // Fetch recent activity
        const res = await fetch('/api/activity?limit=30&period=week')
        if (!res.ok) return

        const data = await res.json()
        const items: ChangeItem[] = data.items || data || []

        if (lastVisit) {
          const lastDate = new Date(lastVisit).getTime()
          const newItems = items.filter(
            (i: ChangeItem) => new Date(i.created_at).getTime() > lastDate
          )
          setChanges(newItems)
        } else {
          // First visit — show last 10 items as "recent"
          setChanges(items.slice(0, 10))
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchChanges()
  }, [])

  const markAsRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setDismissed(true)
  }, [])

  if (loading || dismissed || changes.length === 0) return null

  const groups = groupChanges(changes)
  const nonEmptyGroups = Object.entries(groups).filter(([, items]) => items.length > 0)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="mb-6 rounded-2xl border border-zinc-200/50 bg-white/60 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Sinds je laatste bezoek
            </span>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
              {changes.length}
            </span>
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-zinc-400" />
            )}
          </button>

          <button
            onClick={markAsRead}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
          >
            <Check className="h-3 w-3" />
            Markeer als gelezen
          </button>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="max-h-[300px] overflow-y-auto border-t border-zinc-200/50 p-4 dark:border-zinc-800/50">
            <div className="space-y-4">
              {nonEmptyGroups.map(([group, items]) => (
                <div key={group}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {groupLabels[group]} ({items.length})
                  </h4>
                  <ul className="space-y-1">
                    {items.slice(0, 8).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {item.item_type}
                          </span>
                          <span className="truncate text-zinc-700 dark:text-zinc-300">
                            {item.item_name}
                          </span>
                        </div>
                        <span className="ml-2 shrink-0 text-[11px] text-zinc-400">
                          {actionLabels[item.action] || item.action} &middot;{' '}
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </li>
                    ))}
                    {items.length > 8 && (
                      <li className="px-2 text-xs text-zinc-400">
                        + {items.length - 8} meer
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
