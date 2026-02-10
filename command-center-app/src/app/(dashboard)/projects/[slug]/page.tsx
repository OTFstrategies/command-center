import { ArrowLeft, FolderOpen, Key, Clock, Terminal, Bot, Sparkles, MessageSquare, FileText, Plus, Minus, RefreshCw } from 'lucide-react'
import { getProjectByName } from '@/lib/projects'
import { getCommands, getAgents, getSkills, getPrompts, getApis, getInstructions, getProjectChangelog } from '@/lib/registry'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

// Convert slug back to project name (best effort)
function slugToName(slug: string): string {
  return slug.replace(/-/g, ' ')
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params

  // Try to find project by slug (converted to name)
  const projectName = slugToName(slug)
  const project = await getProjectByName(projectName)

  // Also try with the original slug as project name
  const projectAlt = !project ? await getProjectByName(slug) : null
  const finalProject = project || projectAlt

  if (!finalProject) notFound()

  // Get all assets for this project
  const [commands, agents, skills, prompts, apis, instructions, changelog] = await Promise.all([
    getCommands(finalProject.name),
    getAgents(finalProject.name),
    getSkills(finalProject.name),
    getPrompts(finalProject.name),
    getApis(finalProject.name),
    getInstructions(finalProject.name),
    getProjectChangelog(finalProject.name, 20),
  ])

  // Calculate asset counts
  const totalCommands = commands.reduce((sum, cat) => sum + cat.commands.length, 0)
  const totalAssets = totalCommands + agents.length + skills.length + prompts.length + apis.length + instructions.length

  // Get change type icon
  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
      case 'removed': return <Minus className="h-3.5 w-3.5 text-red-500" />
      case 'updated': return <RefreshCw className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
      default: return <RefreshCw className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
    }
  }

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            {finalProject.name}
          </h1>
          {finalProject.description && (
            <p className="mt-2 text-zinc-500">{finalProject.description}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-sm text-zinc-400">
            <span>{totalAssets} assets</span>
            {changelog.length > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>{changelog.length} changes</span>
              </>
            )}
          </div>
        </div>

        {/* Changelog - prominent position */}
        {changelog.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Recent Changes
            </h2>
            <div className="mt-4 space-y-3">
              {changelog.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 rounded-xl px-4 py-3 bg-white/30 dark:bg-zinc-800/20">
                  <div className="mt-0.5">
                    {getChangeIcon(entry.change_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {entry.title}
                    </p>
                    {entry.items_affected.length > 0 && (
                      <p className="mt-1 text-sm text-zinc-500 truncate">
                        {entry.items_affected.join(', ')}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">
                      {entry.relativeTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assets Overview */}
        {totalAssets > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Assets
            </h2>

            {/* Commands */}
            {totalCommands > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-sm font-medium">Commands ({totalCommands})</span>
                </div>
                <div className="space-y-1">
                  {commands.map((cat) => (
                    cat.commands.map((cmd) => (
                      <div key={cmd.id} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-white/30 dark:hover:bg-zinc-800/20">
                        <code className="text-sm text-zinc-700 dark:text-zinc-300">/{cmd.name}</code>
                        {cmd.description && (
                          <span className="text-sm text-zinc-400 truncate">{cmd.description}</span>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )}

            {/* Agents */}
            {agents.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">Agents ({agents.length})</span>
                </div>
                <div className="space-y-1">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-white/30 dark:hover:bg-zinc-800/20">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{agent.name}</span>
                      <span className="text-xs text-zinc-400">{agent.toolCount} tools</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Skills ({skills.length})</span>
                </div>
                <div className="space-y-1">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-white/30 dark:hover:bg-zinc-800/20">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{skill.name}</span>
                      {skill.description && (
                        <span className="text-sm text-zinc-400 truncate">{skill.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompts */}
            {prompts.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Prompts ({prompts.length})</span>
                </div>
                <div className="space-y-1">
                  {prompts.map((prompt) => (
                    <div key={prompt.id} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-white/30 dark:hover:bg-zinc-800/20">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{prompt.name}</span>
                      <span className="text-xs text-zinc-400">{prompt.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APIs */}
            {apis.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Key className="h-4 w-4" />
                  <span className="text-sm font-medium">APIs ({apis.length})</span>
                </div>
                <div className="space-y-1">
                  {apis.map((api) => (
                    <div key={api.id} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-white/30 dark:hover:bg-zinc-800/20">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{api.name}</span>
                      <span className="text-xs text-zinc-400">{api.authType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Instructions ({instructions.length})</span>
                </div>
                <div className="space-y-1">
                  {instructions.map((inst) => (
                    <div key={inst.id} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-white/30 dark:hover:bg-zinc-800/20">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{inst.name}</span>
                      <span className="text-xs text-zinc-400">{inst.scope}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Folder Structure */}
        {finalProject.folders.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Structure
            </h2>
            <div className="mt-4 space-y-2">
              {finalProject.folders.map((folder) => (
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
        {finalProject.credentials.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Accounts & Credentials
            </h2>
            <div className="mt-4 space-y-2">
              {finalProject.credentials.map((cred) => (
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
      </div>
    </div>
  )
}
