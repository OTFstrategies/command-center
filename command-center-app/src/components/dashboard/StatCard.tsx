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
      className="group flex items-center gap-3 rounded-xl glass px-4 py-3 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-600 glow-hover"
    >
      <span className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.5]">
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{count}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </Link>
  )
}
