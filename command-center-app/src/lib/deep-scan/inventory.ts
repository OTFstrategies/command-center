import * as fs from 'fs'
import * as path from 'path'
import type { ScannedItem, RegistryFile, PluginManifest } from './types'

/**
 * Phase 1: Inventory Scanner
 * Reads all ~/.claude/ directories and produces a ScannedItem[]
 */

function readJsonSafe<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

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

function readdirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
  } catch {
    return []
  }
}

function isDirectorySafe(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

/**
 * Extract description from markdown frontmatter
 */
function extractFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const result: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim()
      const value = line.substring(colonIdx + 1).trim()
      result[key] = value
    }
  }
  return result
}

/**
 * Extract first heading or first meaningful line as description
 */
function extractDescription(content: string): string {
  const lines = content.split('\n')
  // Skip frontmatter
  let inFrontmatter = false
  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }
    if (inFrontmatter) continue
    const trimmed = line.trim()
    if (!trimmed) continue
    // Skip markdown heading markers
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '')
    }
    // Return first non-empty line
    if (trimmed.length > 10) {
      return trimmed.substring(0, 200)
    }
  }
  return ''
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN REGISTRY JSON FILES
// ─────────────────────────────────────────────────────────────────────────────

function scanRegistry(basePath: string): ScannedItem[] {
  const registryDir = path.join(basePath, 'registry')
  if (!existsSafe(registryDir)) return []

  const items: ScannedItem[] = []
  const typeMap: Record<string, ScannedItem['type']> = {
    'agents.json': 'agent',
    'commands.json': 'command',
    'skills.json': 'skill',
    'apis.json': 'api',
    'prompts.json': 'prompt',
    'instructions.json': 'instruction',
  }

  for (const [filename, type] of Object.entries(typeMap)) {
    const filePath = path.join(registryDir, filename)
    const registry = readJsonSafe<RegistryFile>(filePath)
    if (!registry?.items) continue

    for (const item of registry.items) {
      items.push({
        type,
        name: item.name,
        path: item.path,
        description: item.description,
        project: item.project,
        tags: item.tags || [],
        metadata: {
          registryId: item.id,
          created: item.created,
          subcommands: item.subcommands,
          files: item.files,
          service: item.service,
          auth_type: item.auth_type,
          source: 'registry',
        },
      })
    }
  }

  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN FILESYSTEM FOR UNREGISTERED ITEMS
// ─────────────────────────────────────────────────────────────────────────────

function scanCommands(basePath: string, registeredNames: Set<string>): ScannedItem[] {
  const commandsDir = path.join(basePath, 'commands')
  if (!existsSafe(commandsDir)) return []

  const items: ScannedItem[] = []

  function scanDir(dir: string, prefix: string) {
    for (const entry of readdirSafe(dir)) {
      const fullPath = path.join(dir, entry)
      if (isDirectorySafe(fullPath)) {
        // Subcommand directory (e.g., agent-os/)
        scanDir(fullPath, prefix ? `${prefix}/${entry}` : entry)
      } else if (entry.endsWith('.md')) {
        const name = entry.replace('.md', '')
        const fullName = prefix ? `${prefix}/${name}` : name
        if (registeredNames.has(fullName) || registeredNames.has(name)) continue

        const content = readTextSafe(fullPath)
        const frontmatter = extractFrontmatter(content)
        items.push({
          type: 'command',
          name: fullName,
          path: path.relative(basePath, fullPath),
          description: frontmatter.description || extractDescription(content),
          tags: [],
          metadata: { source: 'filesystem', frontmatter },
        })
      }
    }
  }

  scanDir(commandsDir, '')
  return items
}

function scanAgents(basePath: string, registeredNames: Set<string>): ScannedItem[] {
  const agentsDir = path.join(basePath, 'agents')
  if (!existsSafe(agentsDir)) return []

  const items: ScannedItem[] = []

  for (const entry of readdirSafe(agentsDir)) {
    const fullPath = path.join(agentsDir, entry)
    if (isDirectorySafe(fullPath)) {
      // Agent directory (e.g., agent-os/)
      for (const subEntry of readdirSafe(fullPath)) {
        if (!subEntry.endsWith('.md')) continue
        const name = `${entry}/${subEntry.replace('.md', '')}`
        if (registeredNames.has(name)) continue

        const content = readTextSafe(path.join(fullPath, subEntry))
        const frontmatter = extractFrontmatter(content)
        items.push({
          type: 'agent',
          name,
          path: `agents/${entry}/${subEntry}`,
          description: frontmatter.description || extractDescription(content),
          project: entry,
          tags: [],
          metadata: {
            source: 'filesystem',
            frontmatter,
            parentAgent: entry,
            tools: frontmatter.tools,
            model: frontmatter.model,
          },
        })
      }
    } else if (entry.endsWith('.md')) {
      const name = entry.replace('.md', '')
      if (registeredNames.has(name)) continue

      const content = readTextSafe(fullPath)
      const frontmatter = extractFrontmatter(content)
      items.push({
        type: 'agent',
        name,
        path: `agents/${entry}`,
        description: frontmatter.description || extractDescription(content),
        tags: [],
        metadata: { source: 'filesystem', frontmatter },
      })
    }
  }

  return items
}

function scanSkills(basePath: string, registeredNames: Set<string>): ScannedItem[] {
  const skillsDir = path.join(basePath, 'skills')
  if (!existsSafe(skillsDir)) return []

  const items: ScannedItem[] = []

  for (const entry of readdirSafe(skillsDir)) {
    if (registeredNames.has(entry)) continue
    const fullPath = path.join(skillsDir, entry)
    if (!isDirectorySafe(fullPath)) continue

    const skillMd = path.join(fullPath, 'SKILL.md')
    const description = existsSafe(skillMd)
      ? extractDescription(readTextSafe(skillMd))
      : ''

    // Count support files
    const files = readdirSafe(fullPath)
    items.push({
      type: 'skill',
      name: entry,
      path: `skills/${entry}`,
      description,
      tags: [],
      metadata: {
        source: 'filesystem',
        fileCount: files.length,
        hasSkillMd: existsSafe(skillMd),
      },
    })
  }

  return items
}

function scanApis(basePath: string, registeredNames: Set<string>): ScannedItem[] {
  const apisDir = path.join(basePath, 'apis')
  if (!existsSafe(apisDir)) return []

  const items: ScannedItem[] = []

  for (const entry of readdirSafe(apisDir)) {
    const fullPath = path.join(apisDir, entry)
    if (!isDirectorySafe(fullPath)) continue
    if (registeredNames.has(entry)) continue

    // Look for config files inside the service directory
    const configFiles = readdirSafe(fullPath).filter(
      (f) => f.endsWith('.json') || f.endsWith('.md')
    )
    for (const configFile of configFiles) {
      const configPath = path.join(fullPath, configFile)
      let description = ''
      let metadata: Record<string, unknown> = { source: 'filesystem', service: entry }

      if (configFile.endsWith('.json')) {
        const json = readJsonSafe<Record<string, unknown>>(configPath)
        if (json) {
          description = (json.service as string) || entry
          metadata = {
            ...metadata,
            service: json.service,
            project: json.project,
            // Don't expose keys
          }
        }
      } else {
        description = extractDescription(readTextSafe(configPath))
      }

      items.push({
        type: 'api',
        name: `${entry}/${configFile.replace(/\.(json|md)$/, '')}`,
        path: `apis/${entry}/${configFile}`,
        description,
        tags: [],
        metadata,
      })
    }
  }

  return items
}

function scanInstructions(basePath: string, registeredNames: Set<string>): ScannedItem[] {
  const instructionsDir = path.join(basePath, 'instructions')
  if (!existsSafe(instructionsDir)) return []

  const items: ScannedItem[] = []

  function scanDir(dir: string, category: string) {
    for (const entry of readdirSafe(dir)) {
      const fullPath = path.join(dir, entry)
      if (isDirectorySafe(fullPath)) {
        scanDir(fullPath, entry)
      } else if (entry.endsWith('.md')) {
        const name = entry.replace('.md', '')
        if (registeredNames.has(name)) continue

        const content = readTextSafe(fullPath)
        items.push({
          type: 'instruction',
          name,
          path: path.relative(basePath, fullPath),
          description: extractDescription(content),
          tags: category ? [category] : [],
          metadata: { source: 'filesystem', category },
        })
      }
    }
  }

  scanDir(instructionsDir, '')
  return items
}

function scanPrompts(basePath: string, registeredNames: Set<string>): ScannedItem[] {
  const promptsDir = path.join(basePath, 'prompts')
  if (!existsSafe(promptsDir)) return []

  const items: ScannedItem[] = []

  function scanDir(dir: string, category: string) {
    for (const entry of readdirSafe(dir)) {
      const fullPath = path.join(dir, entry)
      if (isDirectorySafe(fullPath)) {
        scanDir(fullPath, entry)
      } else if (entry.endsWith('.md')) {
        const name = entry.replace('.md', '')
        if (registeredNames.has(name)) continue

        const content = readTextSafe(fullPath)
        items.push({
          type: 'prompt',
          name,
          path: path.relative(basePath, fullPath),
          description: extractDescription(content),
          tags: category ? [category] : [],
          metadata: { source: 'filesystem', category },
        })
      }
    }
  }

  scanDir(promptsDir, '')
  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN PLUGINS
// ─────────────────────────────────────────────────────────────────────────────

function scanPlugins(basePath: string): ScannedItem[] {
  const items: ScannedItem[] = []

  // Scan local plugins
  const localDir = path.join(basePath, 'plugins', 'local')
  if (existsSafe(localDir)) {
    for (const pluginName of readdirSafe(localDir)) {
      const pluginDir = path.join(localDir, pluginName)
      if (!isDirectorySafe(pluginDir)) continue

      const manifestPath = path.join(pluginDir, '.claude-plugin', 'plugin.json')
      const manifest = readJsonSafe<PluginManifest>(manifestPath)

      items.push({
        type: 'plugin',
        name: pluginName,
        path: `plugins/local/${pluginName}`,
        description: manifest?.description || `Local plugin: ${pluginName}`,
        tags: ['local'],
        metadata: {
          source: 'filesystem',
          version: manifest?.version,
          author: manifest?.author?.name,
          isLocal: true,
          hasAgents: existsSafe(path.join(pluginDir, 'agents')),
          hasCommands: existsSafe(path.join(pluginDir, 'commands')),
          hasSkills: existsSafe(path.join(pluginDir, 'skills')),
        },
      })

      // Scan plugin's agents
      const agentsDir = path.join(pluginDir, 'agents')
      if (existsSafe(agentsDir)) {
        for (const agentFile of readdirSafe(agentsDir)) {
          if (!agentFile.endsWith('.md')) continue
          const content = readTextSafe(path.join(agentsDir, agentFile))
          const frontmatter = extractFrontmatter(content)
          items.push({
            type: 'agent',
            name: `${pluginName}/${agentFile.replace('.md', '')}`,
            path: `plugins/local/${pluginName}/agents/${agentFile}`,
            description: frontmatter.description || extractDescription(content),
            project: pluginName,
            tags: ['plugin'],
            metadata: {
              source: 'plugin',
              plugin: pluginName,
              frontmatter,
            },
          })
        }
      }

      // Scan plugin's commands
      const commandsDir = path.join(pluginDir, 'commands')
      if (existsSafe(commandsDir)) {
        for (const cmdFile of readdirSafe(commandsDir)) {
          if (!cmdFile.endsWith('.md')) continue
          const content = readTextSafe(path.join(commandsDir, cmdFile))
          const frontmatter = extractFrontmatter(content)
          items.push({
            type: 'command',
            name: `${pluginName}/${cmdFile.replace('.md', '')}`,
            path: `plugins/local/${pluginName}/commands/${cmdFile}`,
            description: frontmatter.description || extractDescription(content),
            project: pluginName,
            tags: ['plugin'],
            metadata: {
              source: 'plugin',
              plugin: pluginName,
              frontmatter,
            },
          })
        }
      }

      // Scan plugin's skills
      const skillsDir = path.join(pluginDir, 'skills')
      if (existsSafe(skillsDir)) {
        for (const skillFolder of readdirSafe(skillsDir)) {
          const skillPath = path.join(skillsDir, skillFolder)
          if (!isDirectorySafe(skillPath)) continue
          const skillMd = path.join(skillPath, 'SKILL.md')
          const description = existsSafe(skillMd)
            ? extractDescription(readTextSafe(skillMd))
            : ''
          items.push({
            type: 'skill',
            name: `${pluginName}/${skillFolder}`,
            path: `plugins/local/${pluginName}/skills/${skillFolder}`,
            description,
            project: pluginName,
            tags: ['plugin'],
            metadata: {
              source: 'plugin',
              plugin: pluginName,
            },
          })
        }
      }
    }
  }

  // Scan installed/cached plugins (lighter scan — just names and versions)
  const cacheDir = path.join(basePath, 'plugins', 'cache')
  if (existsSafe(cacheDir)) {
    for (const publisher of readdirSafe(cacheDir)) {
      const publisherDir = path.join(cacheDir, publisher)
      if (!isDirectorySafe(publisherDir)) continue

      for (const pluginName of readdirSafe(publisherDir)) {
        const pluginDir = path.join(publisherDir, pluginName)
        if (!isDirectorySafe(pluginDir)) continue

        // Find version directories
        const versions = readdirSafe(pluginDir).filter((v) =>
          isDirectorySafe(path.join(pluginDir, v))
        )
        const latestVersion = versions.sort().pop()
        if (!latestVersion) continue

        const versionDir = path.join(pluginDir, latestVersion)
        const manifestPath = path.join(versionDir, 'plugin.json')
        const manifest = readJsonSafe<PluginManifest>(manifestPath)

        items.push({
          type: 'plugin',
          name: `${publisher}/${pluginName}`,
          path: `plugins/cache/${publisher}/${pluginName}`,
          description: manifest?.description || `Installed plugin: ${pluginName}`,
          tags: ['installed'],
          metadata: {
            source: 'cache',
            version: latestVersion,
            publisher,
            isLocal: false,
          },
        })
      }
    }
  }

  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

function scanProjects(basePath: string): ScannedItem[] {
  const projectsDir = path.join(basePath, 'projects')
  if (!existsSafe(projectsDir)) return []

  const items: ScannedItem[] = []

  for (const entry of readdirSafe(projectsDir)) {
    const fullPath = path.join(projectsDir, entry)
    if (!isDirectorySafe(fullPath)) continue

    // Convert folder name back to path (legacy Windows format: C--Users-Name-Projects-foo)
    const projectPath = entry.replace(/--/g, ':\\').replace(/-/g, '\\')

    // Check for CLAUDE.md in the actual project directory
    let claudeMdSummary = ''
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md')
    if (existsSafe(claudeMdPath)) {
      const content = readTextSafe(claudeMdPath)
      // Extract first paragraph as summary
      const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
      claudeMdSummary = lines.slice(0, 3).join(' ').substring(0, 500)
    }

    // Check for memories
    const memoryDir = path.join(fullPath, 'memory')
    const hasMemories = existsSafe(memoryDir)

    // Count sessions
    const sessions = readdirSafe(fullPath).filter((f) => f.endsWith('.jsonl'))

    // Derive project name from path
    const pathParts = entry.split('-')
    const name = pathParts[pathParts.length - 1] || entry

    items.push({
      type: 'project',
      name,
      path: `projects/${entry}`,
      description: claudeMdSummary || `Project at ${projectPath}`,
      tags: [],
      metadata: {
        source: 'filesystem',
        folderName: entry,
        projectPath,
        hasClaudeMd: !!claudeMdSummary,
        hasMemories,
        sessionCount: sessions.length,
      },
    })
  }

  return items
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

function scanDesignSystem(basePath: string): ScannedItem[] {
  const designDir = path.join(basePath, 'design-system')
  if (!existsSafe(designDir)) return []

  const huisstijl = path.join(designDir, 'HUISSTIJL.md')
  const description = existsSafe(huisstijl)
    ? extractDescription(readTextSafe(huisstijl))
    : 'Huisstijl design system'

  // Count all files in design system
  let fileCount = 0
  function countFiles(dir: string) {
    for (const entry of readdirSafe(dir)) {
      const full = path.join(dir, entry)
      if (isDirectorySafe(full)) {
        countFiles(full)
      } else {
        fileCount++
      }
    }
  }
  countFiles(designDir)

  const subdirs = readdirSafe(designDir).filter((e) =>
    isDirectorySafe(path.join(designDir, e))
  )

  return [
    {
      type: 'design-system',
      name: 'Huisstijl',
      path: 'design-system',
      description,
      tags: ['global', 'design'],
      metadata: {
        source: 'filesystem',
        fileCount,
        subdirectories: subdirs,
        hasHuisstijl: existsSafe(huisstijl),
        hasTokens: existsSafe(path.join(designDir, 'tokens')),
        hasAnimations: existsSafe(path.join(designDir, 'animations')),
        hasComponents: existsSafe(path.join(designDir, 'components')),
      },
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECT SERVICES
// ─────────────────────────────────────────────────────────────────────────────

function detectServices(items: ScannedItem[]): ScannedItem[] {
  const services: ScannedItem[] = []
  const detectedServices = new Set<string>()

  // Detect Supabase from APIs
  for (const item of items) {
    const service = item.metadata?.service as string
    if (service && !detectedServices.has(service)) {
      detectedServices.add(service)
      services.push({
        type: 'service',
        name: service,
        path: item.path,
        description: `Externe dienst: ${service}`,
        tags: ['service', 'external'],
        metadata: {
          source: 'detected',
          usedBy: items
            .filter((i) => (i.metadata?.service as string) === service)
            .map((i) => i.name),
        },
      })
    }
  }

  // Always add known services
  const knownServices = [
    { name: 'Vercel', description: 'Hosting en deployment platform' },
    { name: 'Supabase', description: 'PostgreSQL database en authenticatie' },
    { name: 'Anthropic', description: 'Claude AI API provider' },
    { name: 'GitHub', description: 'Code hosting en versiebeheer' },
  ]

  for (const svc of knownServices) {
    if (!detectedServices.has(svc.name.toLowerCase())) {
      services.push({
        type: 'service',
        name: svc.name,
        path: '',
        description: svc.description,
        tags: ['service', 'external'],
        metadata: { source: 'known' },
      })
    }
  }

  return services
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function scanInventory(basePath: string): ScannedItem[] {
  // 1. Start with registry items (source of truth)
  const registryItems = scanRegistry(basePath)

  // Build set of registered names for dedup
  const registeredNames = new Set(registryItems.map((i) => i.name))

  // 2. Scan filesystem for unregistered items
  const extraCommands = scanCommands(basePath, registeredNames)
  const extraAgents = scanAgents(basePath, registeredNames)
  const extraSkills = scanSkills(basePath, registeredNames)
  const extraApis = scanApis(basePath, registeredNames)
  const extraInstructions = scanInstructions(basePath, registeredNames)
  const extraPrompts = scanPrompts(basePath, registeredNames)

  // 3. Scan plugins (always include, even if partially in registry)
  const plugins = scanPlugins(basePath)

  // 4. Scan projects
  const projects = scanProjects(basePath)

  // 5. Scan design system
  const designSystem = scanDesignSystem(basePath)

  // Combine all items
  const allItems = [
    ...registryItems,
    ...extraCommands,
    ...extraAgents,
    ...extraSkills,
    ...extraApis,
    ...extraInstructions,
    ...extraPrompts,
    ...plugins,
    ...projects,
    ...designSystem,
  ]

  // 6. Detect services from collected items
  const services = detectServices(allItems)

  return [...allItems, ...services]
}
