import Link from 'next/link'

interface StatCardProps {
  label: string
  count: number
  icon: React.ReactNode
  href: string
}

export function StatCard({ label, count, icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-zinc-200/50 bg-white/50 px-4 py-3 transition-all duration-300 hover:border-[var(--accent-blue)]/30 hover:bg-white/80 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:border-[var(--accent-blue)]/30 dark:hover:bg-zinc-900/80 glow-blue-hover"
    >
      <span className="text-zinc-400 group-hover:text-[var(--accent-blue)] transition-colors [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.5]">
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{count}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </Link>
  )
}
