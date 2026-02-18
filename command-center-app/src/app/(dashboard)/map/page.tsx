import { getMapData } from '@/lib/map'
import { getCostSummary } from '@/lib/costs'
import { getUsageSummary } from '@/lib/usage'
import { getTimeline } from '@/lib/timeline'
import { getProjectSlugs } from '@/lib/comparison'
import { getBookmarks } from '@/lib/bookmarks'
import { MapPageClient } from '@/components/map/MapPageClient'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const [mapData, costSummary, usageSummary, timelineDays, projectSlugs, bookmarks] = await Promise.all([
    getMapData(),
    getCostSummary(),
    getUsageSummary(),
    getTimeline(),
    getProjectSlugs(),
    getBookmarks(),
  ])

  return (
    <MapPageClient
      data={mapData}
      costSummary={costSummary}
      usageSummary={usageSummary}
      timelineDays={timelineDays}
      projectSlugs={projectSlugs}
      bookmarks={bookmarks}
    />
  )
}
