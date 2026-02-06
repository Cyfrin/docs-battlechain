import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Load search index for context
    const searchIndexPath = path.join(process.cwd(), 'public', 'search-index.json')
    const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8'))

    // Build context from search index (limit to prevent token overflow)
    const contextDocs = searchIndex.slice(0, 20).map((doc: any) => ({
      title: doc.title,
      url: doc.url,
      category: doc.category,
      content: doc.content.substring(0, 500),
    }))

    const contextText = contextDocs
      .map((doc: any) => `[${doc.category}] ${doc.title} (${doc.url})\n${doc.content}`)
      .join('\n\n---\n\n')

    // System prompt
    const systemPrompt = `You are a friendly and helpful assistant for Battlechain, Cyfrin's PvP security-focused blockchain. You help people find what they need in the Battlechain documentation.

Battlechain is an extremely antagonistic blockchain environment designed for trial by fire. Smart contracts are openly exploited in a PvP (player vs player) security arena before production deployment, ensuring only battle-tested code survives.

Here's the documentation content you can reference:

${contextText}

Be conversational and helpful, like a knowledgeable colleague. When you reference pages, format links as [Page Title](/url/path). Keep answers concise but complete. If something isn't in the docs or you're unsure, just say so - no need to be overly formal about it.`

    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' })

    // Build chat history (convert 'assistant' to 'model' for Gemini API)
    const history = conversationHistory || []
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will help users find information in the Battlechain documentation.' }],
        },
        ...history.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }],
        })),
      ],
    })

    const result = await chat.sendMessage(message)
    const response = result.response.text()

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
