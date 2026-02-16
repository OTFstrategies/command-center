import * as fs from 'fs'
import * as path from 'path'
import type { ScannedItem, DetectedHierarchy, DetectedRelationship } from './types'

/**
 * Phase 3: Relationship Detection
 * Takes ScannedItem[] + DetectedHierarchy[] and produces DetectedRelationship[]
 *
 * Detection methods:
 * 1. Same project: items with matching project field → belongs_to
 * 2. Shared services: projects using same Supabase/Vercel → shares_service
 * 3. Design system: projects referencing Huisstijl → applies_to
 * 4. Parent-child: from hierarchy data → parent_of
 * 5. Plugin-asset: assets inside plugin → belongs_to plugin
 * 6. Agent-command references: agents referencing commands → invokes
 * 7. Tag matching: items sharing tags → related_to
 * 8. Service dependencies: projects with service configs → depends_on
 * 9. Deployment: projects deployed on Vercel → deployed_on
 */

function readTextSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function existsSafe(p: string): boolean {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

export function detectRelationships(
  items: ScannedItem[],
  hierarchies: DetectedHierarchy[],
  basePath: string
): DetectedRelationship[] {
  const relationships: DetectedRelationship[] = []
  const seen = new Set<string>() // Prevent duplicates

  function addRel(rel: DetectedRelationship) {
    const key = `${rel.sourceType}:${rel.sourceId}→${rel.targetType}:${rel.targetId}:${rel.relationship}`
    if (seen.has(key)) return
    seen.add(key)
    relationships.push(rel)
  }

  const projects = items.filter((i) => i.type === 'project')
  const projectNames = new Set(projects.map((p) => p.name))

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Same project: items with matching project field → belongs_to
  // ─────────────────────────────────────────────────────────────────────────
  for (const item of items) {
    if (!item.project || item.type === 'project') continue
    if (projectNames.has(item.project) || items.some((i) => i.type === 'project' && i.name === item.project)) {
      addRel({
        sourceType: item.type,
        sourceId: item.name,
        targetType: 'project',
        targetId: item.project,
        relationship: 'belongs_to',
        direction: 'source_to_target',
        strength: 2,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Shared services: detect Supabase project IDs, Vercel configs
  // ─────────────────────────────────────────────────────────────────────────
  const projectServices = new Map<string, Set<string>>()

  for (const project of projects) {
    const projectPath = (project.metadata?.projectPath as string) || ''
    if (!projectPath) continue

    const services = new Set<string>()

    // Check for Supabase
    const envPath = path.join(projectPath, '.env.local')
    if (existsSafe(envPath)) {
      const envContent = readTextSafe(envPath)
      if (envContent.includes('SUPABASE')) {
        services.add('supabase')
        // Extract project ref
        const refMatch = envContent.match(/supabase\.co.*?\/([a-z]{20})/)
        if (refMatch) {
          services.add(`supabase:${refMatch[1]}`)
        }
      }
    }

    // Check for Vercel
    const vercelDir = path.join(projectPath, '.vercel')
    if (existsSafe(vercelDir)) {
      services.add('vercel')
    }

    // Check for package.json dependencies
    const pkgPath = path.join(projectPath, 'package.json')
    if (existsSafe(pkgPath)) {
      const pkgContent = readTextSafe(pkgPath)
      if (pkgContent.includes('@supabase')) services.add('supabase')
      if (pkgContent.includes('next')) services.add('nextjs')
      if (pkgContent.includes('react')) services.add('react')
    }

    // Check for CLAUDE.md references
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md')
    if (existsSafe(claudeMdPath)) {
      const content = readTextSafe(claudeMdPath)
      if (content.includes('Huisstijl') || content.includes('design-system')) {
        services.add('huisstijl')
      }
      if (content.includes('supabase') || content.includes('Supabase')) {
        services.add('supabase')
      }
      if (content.includes('Vercel') || content.includes('vercel')) {
        services.add('vercel')
      }
    }

    if (services.size > 0) {
      projectServices.set(project.name, services)
    }
  }

  // Find shared services between projects
  const projectList = Array.from(projectServices.entries())
  for (let i = 0; i < projectList.length; i++) {
    for (let j = i + 1; j < projectList.length; j++) {
      const [nameA, servicesA] = projectList[i]
      const [nameB, servicesB] = projectList[j]
      const shared = [...servicesA].filter((s) => servicesB.has(s))

      for (const service of shared) {
        addRel({
          sourceType: 'project',
          sourceId: nameA,
          targetType: 'project',
          targetId: nameB,
          relationship: 'shares_service',
          direction: 'bidirectional',
          strength: service.startsWith('supabase:') ? 3 : 1,
          metadata: { service },
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Design system references
  // ─────────────────────────────────────────────────────────────────────────
  const designSystem = items.find((i) => i.type === 'design-system')
  if (designSystem) {
    for (const [projectName, services] of projectServices) {
      if (services.has('huisstijl')) {
        addRel({
          sourceType: 'project',
          sourceId: projectName,
          targetType: 'design-system',
          targetId: designSystem.name,
          relationship: 'applies',
          direction: 'source_to_target',
          strength: 2,
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Parent-child from hierarchy data
  // ─────────────────────────────────────────────────────────────────────────
  for (const h of hierarchies) {
    if (!h.parentName) continue
    addRel({
      sourceType: h.assetType,
      sourceId: h.parentName,
      targetType: h.assetType,
      targetId: h.assetName,
      relationship: 'parent_of',
      direction: 'source_to_target',
      strength: 3,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Plugin-asset: assets inside plugin → belongs_to plugin
  // ─────────────────────────────────────────────────────────────────────────
  const pluginItems = items.filter((i) => i.metadata?.source === 'plugin')
  for (const item of pluginItems) {
    const pluginName = item.metadata?.plugin as string
    if (!pluginName) continue
    addRel({
      sourceType: item.type,
      sourceId: item.name,
      targetType: 'plugin',
      targetId: pluginName,
      relationship: 'part_of',
      direction: 'source_to_target',
      strength: 3,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Agent-command references: parse agent files for command mentions
  // ─────────────────────────────────────────────────────────────────────────
  const commandNames = new Set(items.filter((i) => i.type === 'command').map((i) => i.name))
  const agents = items.filter((i) => i.type === 'agent')

  for (const agent of agents) {
    const agentPath = path.join(basePath, agent.path)
    if (!existsSafe(agentPath)) continue

    const content = readTextSafe(agentPath)
    // Look for /command-name patterns or command references
    for (const cmdName of commandNames) {
      const shortName = cmdName.split('/').pop() || cmdName
      if (
        content.includes(`/${shortName}`) ||
        content.includes(`"${shortName}"`) ||
        content.includes(`'${shortName}'`)
      ) {
        addRel({
          sourceType: 'agent',
          sourceId: agent.name,
          targetType: 'command',
          targetId: cmdName,
          relationship: 'invokes',
          direction: 'source_to_target',
          strength: 2,
          metadata: { detectedIn: agent.path },
        })
      }
    }

    // Look for agent-to-agent references
    for (const otherAgent of agents) {
      if (otherAgent.name === agent.name) continue
      const shortName = otherAgent.name.split('/').pop() || otherAgent.name
      if (content.includes(shortName) && shortName.length > 3) {
        addRel({
          sourceType: 'agent',
          sourceId: agent.name,
          targetType: 'agent',
          targetId: otherAgent.name,
          relationship: 'references',
          direction: 'source_to_target',
          strength: 1,
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Tag matching: items sharing tags → related_to (weak)
  // ─────────────────────────────────────────────────────────────────────────
  const taggedItems = items.filter(
    (i) => i.tags && i.tags.length > 0 && !['plugin', 'local', 'installed'].includes(i.tags[0])
  )
  const tagGroups = new Map<string, ScannedItem[]>()

  for (const item of taggedItems) {
    for (const tag of item.tags || []) {
      if (['plugin', 'local', 'installed', 'global', 'service', 'external', 'design'].includes(tag))
        continue
      const group = tagGroups.get(tag) || []
      group.push(item)
      tagGroups.set(tag, group)
    }
  }

  for (const [tag, group] of tagGroups) {
    if (group.length < 2 || group.length > 10) continue // Skip trivial or too large groups
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        addRel({
          sourceType: group[i].type,
          sourceId: group[i].name,
          targetType: group[j].type,
          targetId: group[j].name,
          relationship: 'related_to',
          direction: 'bidirectional',
          strength: 1,
          metadata: { sharedTag: tag },
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Service dependencies: project → depends_on service
  // ─────────────────────────────────────────────────────────────────────────
  const serviceItems = items.filter((i) => i.type === 'service')
  const serviceByName = new Map(serviceItems.map((s) => [s.name.toLowerCase(), s]))

  for (const [projectName, services] of projectServices) {
    for (const service of services) {
      // Skip sub-identifiers like "supabase:ref"
      if (service.includes(':')) continue

      const serviceItem = serviceByName.get(service)
      if (serviceItem) {
        addRel({
          sourceType: 'project',
          sourceId: projectName,
          targetType: 'service',
          targetId: serviceItem.name,
          relationship: 'depends_on',
          direction: 'source_to_target',
          strength: 2,
        })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Deployment: project deployed_on Vercel
  // ─────────────────────────────────────────────────────────────────────────
  for (const [projectName, services] of projectServices) {
    if (services.has('vercel')) {
      addRel({
        sourceType: 'project',
        sourceId: projectName,
        targetType: 'service',
        targetId: 'Vercel',
        relationship: 'deployed_on',
        direction: 'source_to_target',
        strength: 2,
      })
    }
  }

  return relationships
}
