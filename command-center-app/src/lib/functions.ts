/**
 * Capability detection for project dossier.
 * Analyzes project assets (commands, agents, skills, APIs, code symbols)
 * and groups them into functional categories.
 */

interface RegistryAsset {
  name: string
  description?: string | null
  type: string
}

interface DetectedCapability {
  category: string
  label: string
  items: { name: string; type: string; description?: string | null }[]
}

const categoryDetectors: {
  category: string
  label: string
  keywords: string[]
}[] = [
  {
    category: 'generation',
    label: 'Document Generatie',
    keywords: ['generate', 'create', 'template', 'output', 'build', 'render', 'export', 'pdf', 'docx', 'document'],
  },
  {
    category: 'management',
    label: 'Project Management',
    keywords: ['task', 'plan', 'kanban', 'board', 'sprint', 'roadmap', 'milestone', 'project', 'manage'],
  },
  {
    category: 'automation',
    label: 'Automatisering',
    keywords: ['auto', 'schedule', 'cron', 'trigger', 'hook', 'workflow', 'pipeline', 'sync'],
  },
  {
    category: 'search',
    label: 'Zoeken & Navigatie',
    keywords: ['search', 'find', 'query', 'filter', 'navigate', 'browse', 'lookup', 'index'],
  },
  {
    category: 'data',
    label: 'Data & Opslag',
    keywords: ['database', 'supabase', 'storage', 'data', 'migration', 'schema', 'table', 'record'],
  },
  {
    category: 'analysis',
    label: 'Analyse & Inzicht',
    keywords: ['analyze', 'scan', 'diagnos', 'metric', 'health', 'report', 'insight', 'intelligence'],
  },
  {
    category: 'communication',
    label: 'Communicatie',
    keywords: ['message', 'notification', 'email', 'chat', 'alert', 'notify', 'inbox'],
  },
  {
    category: 'security',
    label: 'Beveiliging',
    keywords: ['security', 'auth', 'permission', 'role', 'access', 'credential', 'encrypt', 'rls'],
  },
  {
    category: 'visualization',
    label: 'Visualisatie',
    keywords: ['diagram', 'chart', 'graph', 'map', 'visual', 'miro', 'canvas', 'display', 'render'],
  },
  {
    category: 'development',
    label: 'Development',
    keywords: ['code', 'build', 'test', 'deploy', 'lint', 'format', 'compile', 'debug', 'develop'],
  },
]

export function detectCapabilities(assets: RegistryAsset[]): DetectedCapability[] {
  const capabilities = new Map<string, DetectedCapability>()

  for (const asset of assets) {
    const text = `${asset.name} ${asset.description || ''}`.toLowerCase()

    for (const detector of categoryDetectors) {
      const matches = detector.keywords.some((kw) => text.includes(kw))
      if (matches) {
        const existing = capabilities.get(detector.category)
        if (existing) {
          existing.items.push({
            name: asset.name,
            type: asset.type,
            description: asset.description,
          })
        } else {
          capabilities.set(detector.category, {
            category: detector.category,
            label: detector.label,
            items: [{
              name: asset.name,
              type: asset.type,
              description: asset.description,
            }],
          })
        }
      }
    }
  }

  // Sort by number of items (most capable first)
  return [...capabilities.values()].sort((a, b) => b.items.length - a.items.length)
}
