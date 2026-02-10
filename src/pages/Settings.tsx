export function Settings() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>

      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Supabase Connection</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Connected to Command Center database
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-zinc-600 dark:bg-zinc-400" />
            <span className="text-xs text-zinc-500">Connected</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Theme</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Follows system preference
          </p>
        </div>
      </div>
    </div>
  )
}
