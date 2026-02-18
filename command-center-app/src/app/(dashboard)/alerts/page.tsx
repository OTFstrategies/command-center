import { Bell } from 'lucide-react'
import { getAlerts, getAlertCounts } from '@/lib/alerts'
import AlertsList from '@/components/alerts/AlertsList'

export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  const [alerts, counts] = await Promise.all([
    getAlerts(),
    getAlertCounts(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Alerts
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {counts.total} openstaand
              {counts.critical > 0 && <> &middot; <span className="text-red-500">{counts.critical} kritiek</span></>}
              {counts.warning > 0 && <> &middot; <span className="text-amber-500">{counts.warning} waarschuwing{counts.warning > 1 ? 'en' : ''}</span></>}
              {counts.info > 0 && <> &middot; {counts.info} info</>}
            </p>
          </div>
          <Bell className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
        </div>

        <AlertsList initialAlerts={alerts} />
      </div>
    </div>
  )
}
