import React, { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  defaultOpen?: boolean
  title?: string
  onSend?: (message: string) => Promise<string>
}

type Pos = { x: number; y: number }
type Size = { width: number; height: number }

const POSITION_KEY = "assistant_position"
const SIZE_KEY = "assistant_size"

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function AssistantFloatWindow(props: Props) {
  const title = props.title || "农业智能助手"
  const [open, setOpen] = useState(Boolean(props.defaultOpen))
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState<Pos>(() => readJson<Pos | null>(POSITION_KEY, null) || { x: 0, y: 0 })
  const [size, setSize] = useState<Size>(() => readJson<Size | null>(SIZE_KEY, null) || { width: 350, height: 500 })
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "你好！我是你的农业助手，有什么关于柑橘种植、成熟度检测的问题可以问我哦~" },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; baseX: number; baseY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  })
  const resizeRef = useRef<{
    active: boolean
    dir: string
    startX: number
    startY: number
    baseW: number
    baseH: number
    baseX: number
    baseY: number
  }>({ active: false, dir: "", startX: 0, startY: 0, baseW: 0, baseH: 0, baseX: 0, baseY: 0 })

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(max-width: 576px)").matches || window.matchMedia("(pointer: coarse)").matches
  }, [])

  useEffect(() => {
    if (!open) return
    const storedPos = readJson<Pos | null>(POSITION_KEY, null)
    const storedSize = readJson<Size | null>(SIZE_KEY, null)
    if (storedPos) setPos(storedPos)
    if (storedSize) setSize(storedSize)
  }, [open])

  useEffect(() => {
    if (!open) return
    writeJson(POSITION_KEY, pos)
  }, [open, pos])

  useEffect(() => {
    if (!open) return
    writeJson(SIZE_KEY, size)
  }, [open, size])

  const maxW = Math.floor(window.innerWidth * 0.8)
  const maxH = Math.floor(window.innerHeight * 0.8)
  const minW = 320
  const minH = 240

  const effectiveSize = {
    width: clamp(size.width, minW, maxW),
    height: clamp(size.height, minH, maxH),
  }

  const effectivePos = {
    x: clamp(pos.x, 0, Math.max(0, window.innerWidth - effectiveSize.width)),
    y: clamp(pos.y, 0, Math.max(0, window.innerHeight - effectiveSize.height)),
  }

  async function onSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "正在输入..." }])
    setSending(true)
    try {
      const reply = props.onSend ? await props.onSend(text) : "暂未配置后端。"
      setMessages((m) => {
        const next = [...m]
        const idx = next.findLastIndex((x) => x.role === "assistant" && x.content === "正在输入...")
        if (idx >= 0) next[idx] = { role: "assistant", content: reply }
        else next.push({ role: "assistant", content: reply })
        return next
      })
    } finally {
      setSending(false)
    }
  }

  function reset() {
    localStorage.removeItem(POSITION_KEY)
    localStorage.removeItem(SIZE_KEY)
    setPos({ x: 0, y: 0 })
    setSize({ width: 350, height: 500 })
    setMinimized(false)
  }

  function onHeaderPointerDown(e: React.PointerEvent) {
    if (isMobile) return
    const target = e.target as HTMLElement
    if (target.closest("[data-role=actions]")) return
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: effectivePos.x,
      baseY: effectivePos.y,
    }
    document.body.style.userSelect = "none"
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onHeaderPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const x = clamp(dragRef.current.baseX + dx, 0, Math.max(0, window.innerWidth - effectiveSize.width))
    const y = clamp(dragRef.current.baseY + dy, 0, Math.max(0, window.innerHeight - effectiveSize.height))
    setPos({ x, y })
  }

  function onHeaderPointerUp() {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    document.body.style.userSelect = ""
  }

  function onResizePointerDown(dir: string, e: React.PointerEvent) {
    resizeRef.current = {
      active: true,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      baseW: effectiveSize.width,
      baseH: effectiveSize.height,
      baseX: effectivePos.x,
      baseY: effectivePos.y,
    }
    document.body.style.userSelect = "none"
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onResizePointerMove(e: React.PointerEvent) {
    if (!resizeRef.current.active) return
    const dx = e.clientX - resizeRef.current.startX
    const dy = e.clientY - resizeRef.current.startY
    const dir = resizeRef.current.dir
    let w = resizeRef.current.baseW
    let h = resizeRef.current.baseH
    let x = resizeRef.current.baseX
    let y = resizeRef.current.baseY

    if (dir.includes("e")) w = resizeRef.current.baseW + dx
    if (dir.includes("s")) h = resizeRef.current.baseH + dy
    if (dir.includes("w")) {
      w = resizeRef.current.baseW - dx
      x = resizeRef.current.baseX + dx
    }
    if (dir.includes("n")) {
      h = resizeRef.current.baseH - dy
      y = resizeRef.current.baseY + dy
    }

    w = clamp(w, minW, maxW)
    h = clamp(h, minH, maxH)
    x = clamp(x, 0, Math.max(0, window.innerWidth - w))
    y = clamp(y, 0, Math.max(0, window.innerHeight - h))
    setSize({ width: w, height: h })
    setPos({ x, y })
  }

  function onResizePointerUp() {
    if (!resizeRef.current.active) return
    resizeRef.current.active = false
    document.body.style.userSelect = ""
  }

  if (!open) {
    return (
      <button
        style={{
          position: "fixed",
          right: 30,
          bottom: 30,
          width: 60,
          height: 60,
          borderRadius: 999,
          border: "none",
          background: "#2E7D32",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
          zIndex: 9999,
        }}
        onClick={() => setOpen(true)}
      >
        🤖
      </button>
    )
  }

  if (minimized) {
    return (
      <button
        style={{
          position: "fixed",
          right: 30,
          bottom: 30,
          width: 60,
          height: 60,
          borderRadius: 999,
          border: "none",
          background: "#2E7D32",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
          zIndex: 9999,
        }}
        onClick={() => setMinimized(false)}
      >
        🤖
      </button>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        left: effectivePos.x,
        top: effectivePos.y,
        width: effectiveSize.width,
        height: effectiveSize.height,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#2E7D32",
          color: "#fff",
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          touchAction: "none",
          cursor: isMobile ? "default" : "move",
        }}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div data-role="actions" style={{ display: "flex", gap: 8 }}>
          <button onClick={reset} style={{ border: "none", background: "transparent", color: "#fff", cursor: "pointer" }}>
            复位
          </button>
          <button onClick={() => setMinimized(true)} style={{ border: "none", background: "transparent", color: "#fff", cursor: "pointer" }}>
            最小化
          </button>
          <button onClick={() => setOpen(false)} style={{ border: "none", background: "transparent", color: "#fff", cursor: "pointer" }}>
            关闭
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12, background: "#f9f9f9" }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              maxWidth: "80%",
              padding: "10px 12px",
              borderRadius: 16,
              marginBottom: 8,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#2E7D32" : "#e5e5ea",
              color: m.role === "user" ? "#fff" : "#333",
            }}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? onSend() : undefined)}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", outline: "none" }}
          placeholder="输入你的问题..."
        />
        <button
          disabled={sending}
          onClick={onSend}
          style={{
            border: "none",
            borderRadius: 10,
            background: sending ? "#999" : "#2E7D32",
            color: "#fff",
            padding: "10px 14px",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          发送
        </button>
      </div>

      {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const)
        .filter((d) => (isMobile ? d === "se" : true))
        .map((dir) => {
          const base: React.CSSProperties = {
            position: "absolute",
            background: "rgba(0,0,0,0.08)",
            zIndex: 10000,
            touchAction: "none",
          }
          const edge: Record<string, React.CSSProperties> = {
            n: { left: 0, right: 0, top: 0, height: 8, cursor: "ns-resize" },
            s: { left: 0, right: 0, bottom: 0, height: 8, cursor: "ns-resize" },
            e: { top: 0, bottom: 0, right: 0, width: 8, cursor: "ew-resize" },
            w: { top: 0, bottom: 0, left: 0, width: 8, cursor: "ew-resize" },
            ne: { top: 0, right: 0, width: 16, height: 16, cursor: "nesw-resize" },
            nw: { top: 0, left: 0, width: 16, height: 16, cursor: "nwse-resize" },
            se: { bottom: 0, right: 0, width: 16, height: 16, cursor: "nwse-resize" },
            sw: { bottom: 0, left: 0, width: 16, height: 16, cursor: "nesw-resize" },
          }
          return (
            <div
              key={dir}
              style={{ ...base, ...edge[dir] }}
              onPointerDown={(e) => onResizePointerDown(dir, e)}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerUp}
              onPointerCancel={onResizePointerUp}
            />
          )
        })}
    </div>
  )
}

