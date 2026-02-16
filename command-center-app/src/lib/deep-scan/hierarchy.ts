import type { ScannedItem, DetectedHierarchy } from './types'

/**
 * Phase 2: Hierarchy Detection
 * Takes ScannedItem[] and produces DetectedHierarchy[]
 *
 * Detection rules:
 * 1. Command naming: split on '-' and match prefixes (miro-flowcharts-process-linear → parent miro-flowcharts-process)
 * 2. Agent folders: items in agents/agent-os/*.md → parent is agent-os
 * 3. Plugin contents: items sourced from plugins → parent is the plugin
 * 4. Skill nesting: skills inside plugin folders → parent is the plugin
 */

export function detectHierarchies(items: ScannedItem[]): DetectedHierarchy[] {
  const hierarchies: DetectedHierarchy[] = []
  const itemsByName = new Map<string, ScannedItem>()

  // Build lookup map
  for (const item of items) {
    itemsByName.set(item.name, item)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Command hierarchy by naming convention
  // ─────────────────────────────────────────────────────────────────────────
  const commands = items.filter((i) => i.type === 'command')

  for (const cmd of commands) {
    // Handle slash-style subcommands: "agent-os/write-spec"
    if (cmd.name.includes('/')) {
      const parts = cmd.name.split('/')
      const parentName = parts[0]
      const parentItem = commands.find(
        (c) => c.name === parentName || c.name === parts.slice(0, -1).join('/')
      )

      if (parentItem) {
        hierarchies.push({
          assetType: 'command',
          assetName: cmd.name,
          parentName: parentItem.name,
          rootName: parts[0],
          depth: parts.length - 1,
          path: parts.join(' > '),
          sortOrder: hierarchies.length,
        })
        continue
      }
    }

    // Handle dash-style hierarchy: "miro-flowcharts-process-linear"
    const parts = cmd.name.split('-')
    if (parts.length > 1) {
      // Try progressively shorter prefixes
      let foundParent = false
      for (let i = parts.length - 1; i >= 1; i--) {
        const candidateParent = parts.slice(0, i).join('-')
        if (
          itemsByName.has(candidateParent) &&
          itemsByName.get(candidateParent)?.type === 'command'
        ) {
          hierarchies.push({
            assetType: 'command',
            assetName: cmd.name,
            parentName: candidateParent,
            rootName: parts[0],
            depth: parts.length - i,
            path: `${candidateParent} > ${cmd.name}`,
            sortOrder: hierarchies.length,
          })
          foundParent = true
          break
        }
      }

      // If no parent found but has prefix matching other commands, create implicit parent
      if (!foundParent && parts.length >= 3) {
        const prefix = parts.slice(0, 2).join('-')
        const siblings = commands.filter(
          (c) => c.name !== cmd.name && c.name.startsWith(prefix + '-')
        )
        if (siblings.length > 0) {
          // Check if the prefix itself is a command
          if (itemsByName.has(prefix)) {
            hierarchies.push({
              assetType: 'command',
              assetName: cmd.name,
              parentName: prefix,
              rootName: parts[0],
              depth: parts.length - 2,
              path: `${prefix} > ${cmd.name}`,
              sortOrder: hierarchies.length,
            })
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Agent folder hierarchy
  // ─────────────────────────────────────────────────────────────────────────
  const agents = items.filter((i) => i.type === 'agent')

  for (const agent of agents) {
    const parentAgent = agent.metadata?.parentAgent as string
    if (parentAgent && agent.name.includes('/')) {
      hierarchies.push({
        assetType: 'agent',
        assetName: agent.name,
        parentName: parentAgent,
        rootName: parentAgent,
        depth: 1,
        path: `${parentAgent} > ${agent.name.split('/').pop()}`,
        sortOrder: hierarchies.length,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Plugin contents hierarchy
  // ─────────────────────────────────────────────────────────────────────────
  const pluginItems = items.filter((i) => i.metadata?.source === 'plugin')
  const plugins = items.filter((i) => i.type === 'plugin' && i.tags?.includes('local'))

  for (const item of pluginItems) {
    const pluginName = item.metadata?.plugin as string
    if (!pluginName) continue

    const plugin = plugins.find((p) => p.name === pluginName)
    if (!plugin) continue

    hierarchies.push({
      assetType: item.type,
      assetName: item.name,
      parentName: pluginName,
      rootName: pluginName,
      depth: 1,
      path: `${pluginName} > ${item.name.split('/').pop()}`,
      sortOrder: hierarchies.length,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Project-owned items
  // ─────────────────────────────────────────────────────────────────────────
  const projects = items.filter((i) => i.type === 'project')
  const projectNames = new Set(projects.map((p) => p.name))

  for (const item of items) {
    if (item.type === 'project') continue
    if (!item.project) continue

    // Check if the project field matches a known project
    if (projectNames.has(item.project) || projects.some((p) => p.name === item.project)) {
      // Avoid duplicate hierarchies (already handled by plugin hierarchy)
      const alreadyTracked = hierarchies.some(
        (h) => h.assetName === item.name && h.assetType === item.type
      )
      if (!alreadyTracked) {
        hierarchies.push({
          assetType: item.type,
          assetName: item.name,
          parentName: item.project,
          rootName: item.project,
          depth: 1,
          path: `${item.project} > ${item.name}`,
          sortOrder: hierarchies.length,
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Calculate correct depths for multi-level hierarchies
  // ─────────────────────────────────────────────────────────────────────────
  const childrenByParent = new Map<string, DetectedHierarchy[]>()
  for (const h of hierarchies) {
    if (h.parentName) {
      const existing = childrenByParent.get(h.parentName) || []
      existing.push(h)
      childrenByParent.set(h.parentName, existing)
    }
  }

  // Recalculate depths bottom-up
  function calculateDepth(name: string, visited: Set<string>): number {
    if (visited.has(name)) return 0
    visited.add(name)

    const entry = hierarchies.find((h) => h.assetName === name)
    if (!entry || !entry.parentName) return 0

    return 1 + calculateDepth(entry.parentName, visited)
  }

  for (const h of hierarchies) {
    h.depth = calculateDepth(h.assetName, new Set())
    // Build full path
    const pathParts: string[] = [h.assetName]
    let current = h.parentName
    while (current) {
      pathParts.unshift(current)
      const parent = hierarchies.find((x) => x.assetName === current)
      current = parent?.parentName || null
    }
    h.path = pathParts.join(' > ')
    h.rootName = pathParts[0]
  }

  return hierarchies
}
