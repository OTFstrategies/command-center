'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown, FolderOpen } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ProjectSwitcherProps {
  projects: string[]
  currentProject: string | null
  sidebar?: boolean
}

export function ProjectSwitcher({ projects, currentProject, sidebar }: ProjectSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSelect = (project: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (project) {
      params.set('project', project)
    } else {
      params.delete('project')
    }
    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sidebar compact mode - icon only with tooltip-style dropdown
  if (sidebar) {
    return (
      <div className="relative flex justify-center" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          aria-label={`Project: ${currentProject || 'All'}`}
        >
          <FolderOpen className="h-5 w-5" />
        </button>

        {isOpen && (
          <div className="absolute bottom-0 left-full ml-2 z-50 min-w-[180px] overflow-hidden rounded-xl glass py-1 shadow-xl glow">
            <div className="px-3 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider border-b border-white/10">
              Project
            </div>
            <button
              onClick={() => handleSelect(null)}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                !currentProject
                  ? 'text-zinc-900 dark:text-zinc-50 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              All projects
            </button>

            {projects.length > 0 && (
              <div className="my-1 border-t border-white/10" />
            )}

            {projects.map((project) => (
              <button
                key={project}
                onClick={() => handleSelect(project)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                  currentProject === project
                    ? 'text-zinc-900 dark:text-zinc-50 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {project}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Default mode - full button with text
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 transition-all duration-300 glow-hover"
      >
        <span className="font-medium">{currentProject || 'All'}</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl glass py-1 shadow-xl glow">
          <button
            onClick={() => handleSelect(null)}
            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
              !currentProject
                ? 'text-zinc-900 dark:text-zinc-50 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All projects
          </button>

          {projects.length > 0 && (
            <div className="my-1 border-t border-white/10" />
          )}

          {projects.map((project) => (
            <button
              key={project}
              onClick={() => handleSelect(project)}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                currentProject === project
                  ? 'text-zinc-900 dark:text-zinc-50 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {project}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
