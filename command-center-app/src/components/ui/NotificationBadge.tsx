interface NotificationBadgeProps {
  count: number
  max?: number
}

export function NotificationBadge({ count, max = 9 }: NotificationBadgeProps) {
  if (count <= 0) return null

  const display = count > max ? `${max}+` : String(count)

  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {display}
    </span>
  )
}
