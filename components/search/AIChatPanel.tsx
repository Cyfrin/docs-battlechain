'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, Loader2, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatHistory {
  messages: Message[]
  timestamp: number
}

const CHAT_STORAGE_KEY = 'cyfrin-ai-chat-history'
const CHAT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

// Convert markdown links to clickable links
function renderMessageContent(content: string, onLinkClick: (url: string) => void) {
  const parts: React.ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }

    // Add the link
    const linkText = match[1]
    const url = match[2]
    parts.push(
      <button
        key={match.index}
        onClick={() => onLinkClick(url)}
        className="text-[var(--product-primary)] hover:underline font-medium"
      >
        {linkText}
      </button>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return parts.length > 0 ? parts : content
}

export function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY)
      if (stored) {
        const history: ChatHistory = JSON.parse(stored)
        const age = Date.now() - history.timestamp

        // Only restore if less than 24 hours old
        if (age < CHAT_EXPIRY_MS) {
          setMessages(history.messages)
        } else {
          // Clear expired history
          localStorage.removeItem(CHAT_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const history: ChatHistory = {
          messages,
          timestamp: Date.now(),
        }
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history))
      } catch (error) {
        console.error('Failed to save chat history:', error)
      }
    }
  }, [messages])

  const handleLinkClick = (url: string) => {
    router.push(url)
    if (onClose) {
      onClose()
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        let errorMessage =
          'Sorry, I encountered an error. Please try again.'
        try {
          const data = await response.json()
          if (data.error) {
            errorMessage =
              response.status === 429
                ? 'Too many requests. Please wait a moment and try again.'
                : data.error
          }
        } catch {
          // Response wasn't JSON — use default error
        }
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: errorMessage },
        ])
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
          },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '' },
      ])

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snapshot = accumulated
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: snapshot,
          }
          return updated
        })
      }

      if (accumulated.length === 0) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content:
              "I wasn't able to generate a response. Please try again.",
          }
          return updated
        })
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      sendMessage()
    }
  }

  return (
    <div className="ai-chat-panel flex flex-col h-full border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <Sparkles className="w-4 h-4 text-[var(--product-primary)]" />
              Ask AI
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Not sure what you're looking for?
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <Sparkles className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Ask me anything about Cyfrin documentation</p>
            <p className="text-xs mt-2 max-w-xs">
              I can help you find information about CodeHawks, Updraft, Solodit, Profiles, and Battlechain.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-[var(--product-primary)] text-white dark:bg-white/15 dark:text-gray-100'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {renderMessageContent(message.content, handleLinkClick)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--product-primary)]/50 disabled:opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-[var(--product-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/15 dark:text-gray-100 dark:hover:bg-white/25"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
