export type OutboxItem = {
  id: string
  ts: number
  message: string
  session_id?: string | null
  url?: string
}

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const OUTBOX_KEY = "assistant_outbox"

export function readQueue(storage: StorageLike): OutboxItem[] {
  try {
    const raw = storage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : []
  } catch {
    return []
  }
}

export function writeQueue(storage: StorageLike, queue: OutboxItem[]): void {
  storage.setItem(OUTBOX_KEY, JSON.stringify(queue))
}

export function enqueue(storage: StorageLike, item: Omit<OutboxItem, "id" | "ts"> & Partial<Pick<OutboxItem, "id" | "ts">>): OutboxItem {
  const queue = readQueue(storage)
  const out: OutboxItem = {
    id: item.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ts: item.ts || Date.now(),
    message: String(item.message || ""),
    session_id: item.session_id ?? null,
    url: item.url || "http://localhost:5000/chat",
  }
  queue.push(out)
  writeQueue(storage, queue)
  return out
}

export function pendingCount(storage: StorageLike): number {
  return readQueue(storage).length
}

export async function flush(
  storage: StorageLike,
  fetchFn: typeof fetch,
  opts?: { maxBatch?: number }
): Promise<{ sent: number; remaining: number }> {
  const maxBatch = typeof opts?.maxBatch === "number" ? opts.maxBatch : 10
  let sent = 0
  while (sent < maxBatch) {
    const queue = readQueue(storage)
    const item = queue[0]
    if (!item) break
    const payload: any = { message: item.message }
    if (item.session_id) payload.session_id = item.session_id
    try {
      const res = await fetchFn(item.url || "http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data: any = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 503) break
      if (data && data.retryable === true) break
      queue.shift()
      writeQueue(storage, queue)
      sent += 1
    } catch {
      break
    }
  }
  return { sent, remaining: pendingCount(storage) }
}

export function clear(storage: StorageLike): void {
  storage.removeItem(OUTBOX_KEY)
}

