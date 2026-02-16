import { getMapData } from '@/lib/map'
import { MapPageClient } from '@/components/map/MapPageClient'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const mapData = await getMapData()

  return <MapPageClient data={mapData} />
}
