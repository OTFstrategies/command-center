import { ArrowLeft, FolderOpen, Key, Clock } from 'lucide-react'
import { getProjectBySlug } from '@/lib/projects'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-[var(--accent-blue)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-2 text-zinc-500">{project.description}</p>
          )}
        </div>

        {/* Folder Structure */}
        {project.folders.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Structure
            </h2>
            <div className="mt-4 space-y-2">
              {project.folders.map((folder) => (
                <div key={folder.id} className="flex items-start gap-3 rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-800/20">
                  <FolderOpen className="h-5 w-5 text-zinc-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{folder.path}</p>
                    {folder.description && (
                      <p className="text-sm text-zinc-500 mt-1">{folder.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credentials */}
        {project.credentials.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Accounts & Credentials
            </h2>
            <div className="mt-4 space-y-2">
              {project.credentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-800/20">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{cred.service}</p>
                      {cred.username && (
                        <p className="text-sm text-zinc-500">{cred.username}</p>
                      )}
                    </div>
                  </div>
                  {cred.password && (
                    <code className="text-sm text-zinc-400 font-mono">••••••••</code>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Changelog */}
        {project.changelog.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Changes
            </h2>
            <div className="mt-4 space-y-4">
              {project.changelog.map((entry) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 mt-2" />
                  </div>
                  <div className="pb-6">
                    <p className="text-xs text-zinc-400">
                      {new Date(entry.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
