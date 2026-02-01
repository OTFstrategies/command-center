import { useSync } from '@/lib/hooks/use-sync'
import { SettingsPage } from './components/SettingsPage'
import type { SettingsData, SyncTypeConfig } from '@/../product/sections/settings/types'

export default function SettingsPagePreview() {
  const {
    isConnected,
    projectUrl,
    syncStatus,
    lastSyncTime,
    stats,
    sync,
    isLoading
  } = useSync()

  // Build sync types from stats
  const syncTypes: SyncTypeConfig[] = stats ? [
    { type: 'APIs', enabled: true, itemCount: stats.byType.api, lastSynced: lastSyncTime || undefined },
    { type: 'Prompts', enabled: true, itemCount: stats.byType.prompt, lastSynced: lastSyncTime || undefined },
    { type: 'Skills', enabled: true, itemCount: stats.byType.skill, lastSynced: lastSyncTime || undefined },
    { type: 'Agents', enabled: true, itemCount: stats.byType.agent, lastSynced: lastSyncTime || undefined },
    { type: 'Commands', enabled: true, itemCount: stats.byType.command, lastSynced: lastSyncTime || undefined },
    { type: 'Instructions', enabled: true, itemCount: stats.byType.instruction, lastSynced: lastSyncTime || undefined },
  ] : [
    { type: 'APIs', enabled: true, itemCount: 0 },
    { type: 'Prompts', enabled: true, itemCount: 0 },
    { type: 'Skills', enabled: true, itemCount: 0 },
    { type: 'Agents', enabled: true, itemCount: 0 },
    { type: 'Commands', enabled: true, itemCount: 0 },
    { type: 'Instructions', enabled: true, itemCount: 0 },
  ]

  const data: SettingsData = {
    supabase: {
      projectUrl,
      isConnected,
    },
    syncStatus: isLoading ? 'pending' : syncStatus,
    lastSyncTime: lastSyncTime || undefined,
    syncTypes,
  }

  return (
    <SettingsPage
      data={data}
      onSync={sync}
      onToggleType={(type, enabled) => console.log('Toggle type:', type, enabled)}
    />
  )
}
