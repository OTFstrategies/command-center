export interface SearchItem {
  id: string
  type: string
  name: string
  description: string | null
  project: string | null
  category: 'asset' | 'project' | 'task' | 'page'
  href: string
}

export function fuzzySearch(items: SearchItem[], query: string): SearchItem[] {
  if (!query.trim()) return []

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)

  return items
    .map((item) => {
      const searchText = `${item.name} ${item.description || ''} ${item.project || ''} ${item.type}`.toLowerCase()

      const allMatch = words.every((word) => searchText.includes(word))
      if (!allMatch) return null

      let score = 0
      const nameLower = item.name.toLowerCase()
      const queryLower = query.toLowerCase().trim()

      if (nameLower === queryLower) score = 100
      else if (nameLower.startsWith(queryLower)) score = 50
      else if (nameLower.includes(queryLower)) score = 25
      else score = 10

      if (item.category === 'page') score += 5
      if (item.category === 'project') score += 3

      return { item, score }
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, 20)
    .map((r) => r!.item)
}
