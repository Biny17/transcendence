'use client'
import { useEffect, useRef } from 'react'
import type { EngineState } from './DebugPanel'
interface StatsOverlayProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
const MAX_SAMPLES = 120
export function StatsOverlay({ position = 'top-right' }: StatsOverlayProps) {
  const fpsHistoryRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const valueRef = useRef<{ fps: number; drawCalls: number; triangles: number; memory: number } | null>(null)
  useEffect(() => {
    const drawGraph = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const history = fpsHistoryRef.current
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      const maxFps = Math.max(...history, 1)
      ctx.beginPath()
      ctx.strokeStyle = '#00d4ff'
      ctx.lineWidth = 1.5
      for (let i = 0; i < history.length; i++) {
        const x = (i / (MAX_SAMPLES - 1)) * w
        const y = h - (history[i] / maxFps) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      if (history.length > 1) {
        ctx.beginPath()
        ctx.strokeStyle = '#4aff4a'
        ctx.lineWidth = 1
        const maxDraw = Math.max(...history, 1)
        for (let i = 0; i < history.length; i++) {
          const x = (i / (MAX_SAMPLES - 1)) * w
          const y = h - (history[i] / maxDraw) * h
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.font = '8px JetBrains Mono, monospace'
      ctx.fillStyle = '#00d4ffcc'
      ctx.fillText('FPS', 4, 10)
      ctx.fillStyle = '#4aff4acc'
      ctx.fillText('DRAW', 4, 20)
    }
    const update = () => {
      const eng = window.__engine as EngineState | null | undefined
      if (eng) {
        const vals = valueRef.current
        if (vals) {
          vals.fps = eng.fps ?? 0
          vals.drawCalls = eng.drawCalls ?? 0
          vals.triangles = eng.triangles ?? 0
          vals.memory = eng.memory ?? 0
        }
        const fpsEl = document.getElementById('so-fps')
        const drawEl = document.getElementById('so-draw')
        const triEl = document.getElementById('so-tri')
        const memEl = document.getElementById('so-mem')
        if (fpsEl) fpsEl.textContent = `${eng.fps ?? 0}`
        if (drawEl) drawEl.textContent = `${eng.drawCalls ?? 0}`
        if (triEl) triEl.textContent = eng.triangles != null ? `${(eng.triangles / 1000).toFixed(1)}k` : '—'
        if (memEl) memEl.textContent = `${eng.memory ?? 0}`
        fpsHistoryRef.current.push(eng.fps ?? 0)
        if (fpsHistoryRef.current.length > MAX_SAMPLES) fpsHistoryRef.current.shift()
        drawGraph()
      }
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])
  const posStyle: React.CSSProperties = (() => {
    switch (position) {
      case 'top-left': return { top: 8, left: 8 }
      case 'bottom-left': return { bottom: 8, left: 8 }
      case 'bottom-right': return { bottom: 8, right: 8 }
      default: return { top: 8, right: 8 }
    }
  })()
  return (
    <div id="stats-overlay" className="so-root" style={posStyle}>
      <div className="so-grid">
        <div className="so-cell">
          <span className="so-label">FPS</span>
          <span className="so-val" id="so-fps">—</span>
        </div>
        <div className="so-cell">
          <span className="so-label">DRAW</span>
          <span className="so-val" id="so-draw">—</span>
        </div>
        <div className="so-cell">
          <span className="so-label">TRI</span>
          <span className="so-val" id="so-tri">—</span>
        </div>
        <div className="so-cell">
          <span className="so-label">GEO</span>
          <span className="so-val" id="so-mem">—</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="so-graph" width={MAX_SAMPLES} height={40} />
    </div>
  )
}
