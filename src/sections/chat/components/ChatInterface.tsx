import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (message: string) => void
}

export function ChatInterface({ messages, isLoading, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Command Center Agent</p>
            <p className="text-sm mt-1">Vraag me iets over je registry items</p>
            <div className="mt-6 space-y-2 text-xs">
              <p className="text-zinc-500 dark:text-zinc-400">Voorbeelden:</p>
              <ul className="space-y-1 text-zinc-400 dark:text-zinc-500">
                <li>"Toon alle APIs"</li>
                <li>"Hoeveel prompts heb ik?"</li>
                <li>"Zoek skills met tag 'automation'"</li>
                <li>"Voeg een nieuwe API toe"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    message.role === 'user'
                      ? 'bg-lime-500 text-zinc-900'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    message.role === 'user'
                      ? 'bg-lime-500 text-zinc-900'
                      : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'mt-1 text-[10px]',
                      message.role === 'user'
                        ? 'text-lime-800'
                        : 'text-zinc-400 dark:text-zinc-500'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-400">Aan het denken...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stel een vraag of geef een opdracht..."
            disabled={isLoading}
            className={cn(
              'flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm',
              'placeholder:text-zinc-400',
              'focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
              'dark:placeholder:text-zinc-500 dark:focus:border-lime-400 dark:focus:ring-lime-400'
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              'bg-lime-500 text-zinc-900 transition-colors',
              'hover:bg-lime-400',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2',
              'dark:focus:ring-offset-zinc-900'
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
