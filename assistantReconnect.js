(() => {
  const OUTBOX_KEY = "assistant_outbox";
  const LAST_FLUSH_KEY = "assistant_outbox_last_flush";

  function now() {
    return Date.now();
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function getQueue() {
    const q = readJson(OUTBOX_KEY, []);
    return Array.isArray(q) ? q : [];
  }

  function setQueue(queue) {
    return writeJson(OUTBOX_KEY, queue);
  }

  function enqueue(item) {
    const q = getQueue();
    q.push({
      id: item.id || `${now()}_${Math.random().toString(16).slice(2)}`,
      ts: item.ts || now(),
      message: String(item.message || ""),
      session_id: item.session_id || null,
      url: item.url || "http://localhost:5000/chat",
    });
    setQueue(q);
    return q.length;
  }

  function peek() {
    const q = getQueue();
    return q[0] || null;
  }

  function dequeueMany(n) {
    const q = getQueue();
    const removed = q.splice(0, n);
    setQueue(q);
    return removed;
  }

  function pendingCount() {
    return getQueue().length;
  }

  async function flush(options = {}) {
    const maxBatch = typeof options.maxBatch === "number" ? options.maxBatch : 10;
    const minIntervalMs = typeof options.minIntervalMs === "number" ? options.minIntervalMs : 1500;
    const last = Number(localStorage.getItem(LAST_FLUSH_KEY) || "0");
    if (now() - last < minIntervalMs) return { sent: 0, remaining: pendingCount() };
    localStorage.setItem(LAST_FLUSH_KEY, String(now()));

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return { sent: 0, remaining: pendingCount(), offline: true };
    }

    const q = getQueue();
    const batch = q.slice(0, maxBatch);
    if (batch.length === 0) return { sent: 0, remaining: 0 };

    let sent = 0;
    for (const item of batch) {
      const payload = { message: item.message };
      if (item.session_id) payload.session_id = item.session_id;
      try {
        const res = await fetch(item.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && res.status !== 503) {
          break;
        }
        if (data && data.code && data.retryable === true) {
          break;
        }
        sent += 1;
        dequeueMany(1);
      } catch {
        break;
      }
    }

    return { sent, remaining: pendingCount() };
  }

  function clear() {
    setQueue([]);
    return true;
  }

  window.assistantReconnect = {
    enqueue,
    flush,
    peek,
    pendingCount,
    clear,
  };
})();

