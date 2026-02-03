import { Suspense } from 'react'
import { ShellLayout } from '@/components/shell/ShellLayout'
import { getProjects } from '@/lib/registry'

function ShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="fixed top-0 right-0 left-16 z-40 h-14 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 max-md:left-0" />
      <aside className="fixed inset-y-0 left-0 z-50 w-16 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 max-md:hidden" />
      <main className="min-h-screen pt-14 md:pl-16">{children}</main>
    </div>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const projects = await getProjects()

  return (
    <Suspense fallback={<ShellSkeleton>{children}</ShellSkeleton>}>
      <ShellLayout projects={projects}>{children}</ShellLayout>
    </Suspense>
  )
}
