import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Shadow's Command Center",
  description: 'Dashboard for managing Claude Code assets',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
