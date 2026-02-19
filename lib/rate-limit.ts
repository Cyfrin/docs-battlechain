interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetMs: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS = 15
const MAX_ENTRIES = 500

const requestLog = new Map<string, number[]>()

function evictOldest(): void {
  if (requestLog.size <= MAX_ENTRIES) return

  let oldestKey = ''
  let oldestTime = Infinity

  for (const [key, timestamps] of requestLog) {
    const latest = timestamps[timestamps.length - 1] ?? 0
    if (latest < oldestTime) {
      oldestTime = latest
      oldestKey = key
    }
  }

  if (oldestKey) {
    requestLog.delete(oldestKey)
  }
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const timestamps = requestLog.get(ip) ?? []
  const recent = timestamps.filter((t) => t > windowStart)

  if (recent.length >= MAX_REQUESTS) {
    const oldestInWindow = recent[0] ?? now
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + WINDOW_MS - now,
    }
  }

  recent.push(now)
  requestLog.set(ip, recent)
  evictOldest()

  return {
    allowed: true,
    remaining: MAX_REQUESTS - recent.length,
    resetMs: WINDOW_MS,
  }
}
