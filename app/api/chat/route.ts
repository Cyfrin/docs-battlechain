import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateChatInput } from '@/lib/chat-validation'
import { getRelevantContext } from '@/lib/doc-context'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  const rateLimit = checkRateLimit(ip)
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil(rateLimit.resetMs / 1000)
    return jsonResponse(
      { error: 'Too many requests. Please try again shortly.' },
      429,
      { 'Retry-After': String(retryAfter) }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const validation = validateChatInput(body)
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, 400)
  }

  const { message, conversationHistory } = validation

  try {
    const contextText = getRelevantContext(message)

    const systemPrompt = `You are a friendly and helpful assistant for BattleChain, Cyfrin's PvP security-focused blockchain. You help people find what they need in the BattleChain documentation.

BattleChain is an extremely antagonistic blockchain environment designed for trial by fire. Smart contracts are openly exploited in a PvP (player vs player) security arena before production deployment, ensuring only battle-tested code survives.

Here's the documentation content you can reference:

${contextText}

Be conversational and helpful, like a knowledgeable colleague. When you reference pages, format links as [Page Title](/url/path). Keep answers concise but complete. If something isn't in the docs or you're unsure, just say so - no need to be overly formal about it.`

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((entry) => ({
        role: entry.role as 'user' | 'assistant',
        content: entry.content,
      })),
      { role: 'user', content: message },
    ]

    const stream = await client.chat.completions.create({
      model: 'google/gemini-3-flash-preview',
      messages,
      stream: true,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return jsonResponse(
      { error: 'Failed to process message' },
      500
    )
  }
}
