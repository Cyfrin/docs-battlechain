interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

interface ValidInput {
  valid: true
  message: string
  conversationHistory: HistoryEntry[]
}

interface InvalidInput {
  valid: false
  error: string
}

type ValidationResult = ValidInput | InvalidInput

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_LENGTH = 20
const VALID_ROLES = new Set(['user', 'assistant'])

export function validateChatInput(
  body: unknown
): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const { message, conversationHistory } = body as Record<
    string,
    unknown
  >

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' }
  }

  const trimmed = message.trim()
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
    }
  }

  if (
    conversationHistory !== undefined &&
    !Array.isArray(conversationHistory)
  ) {
    return {
      valid: false,
      error: 'conversationHistory must be an array',
    }
  }

  const history: HistoryEntry[] = []

  if (Array.isArray(conversationHistory)) {
    const capped = conversationHistory.slice(-MAX_HISTORY_LENGTH)

    for (const entry of capped) {
      if (typeof entry !== 'object' || entry === null) {
        return {
          valid: false,
          error: 'Each history entry must be an object',
        }
      }

      const { role, content } = entry as Record<string, unknown>

      if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
        return {
          valid: false,
          error:
            'Each history entry must have role "user" or "assistant"',
        }
      }

      if (typeof content !== 'string') {
        return {
          valid: false,
          error: 'Each history entry must have a string content',
        }
      }

      history.push({ role: role as 'user' | 'assistant', content })
    }
  }

  return { valid: true, message: trimmed, conversationHistory: history }
}
