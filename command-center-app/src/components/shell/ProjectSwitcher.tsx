'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ProjectSwitcherProps {
  projects: string[]
  currentProject: string | null
}

export function ProjectSwitcher({ projects, currentProject }: ProjectSwitcherProps) {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 transition-all duration-300 glow-blue-hover"
      >
        <span className="font-medium">{currentProject || 'All'}</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl glass py-1 shadow-xl glow-blue">
          <button
            onClick={() => handleSelect(null)}
            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-200 ${
              !currentProject
                ? 'text-[var(--accent-blue)] font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-[var(--accent-blue)]'
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
                  ? 'text-[var(--accent-blue)] font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-[var(--accent-blue)]'
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
