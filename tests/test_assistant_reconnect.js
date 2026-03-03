const test = require("node:test")
const assert = require("node:assert")

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }
  setItem(key, value) {
    this.map.set(key, String(value))
  }
  removeItem(key) {
    this.map.delete(key)
  }
}

test("assistantReconnect enqueues and flushes", async () => {
  global.window = global
  global.localStorage = new MemoryStorage()
  global.navigator = { onLine: true }

  let calls = 0
  global.fetch = async () => {
    calls += 1
    return {
      ok: true,
      status: 200,
      json: async () => ({ reply: "ok" }),
    }
  }

  require("../assistantReconnect.js")

  assert.equal(window.assistantReconnect.pendingCount(), 0)
  window.assistantReconnect.enqueue({ message: "Q1", session_id: "s", url: "http://x/chat" })
  window.assistantReconnect.enqueue({ message: "Q2", session_id: "s", url: "http://x/chat" })
  assert.equal(window.assistantReconnect.pendingCount(), 2)

  const r = await window.assistantReconnect.flush({ maxBatch: 10, minIntervalMs: 0 })
  assert.equal(r.sent, 2)
  assert.equal(window.assistantReconnect.pendingCount(), 0)
  assert.equal(calls, 2)
})

