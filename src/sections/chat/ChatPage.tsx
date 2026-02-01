import { useState, useCallback } from 'react'
import { ChatInterface, type Message } from './components/ChatInterface'
import { supabase } from '@/lib/supabase'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('chat-agent', {
        body: { message: content },
      })

      if (error) {
        throw error
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Geen antwoord ontvangen.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Er ging iets mis: ${err instanceof Error ? err.message : 'Onbekende fout'}. Controleer of de Edge Function is gedeployed.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto h-full max-w-3xl">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}
