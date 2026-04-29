'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { LogConsole } from './LogConsole'
import './DebugPanel.css'
interface ConsoleWindowProps {
  filterTags: string[]
  setFilterTags: (tags: string[]) => void
  fontSize?: number
  onChangeFontSize?: (delta: number) => void
}
const STORAGE_KEY = 'dbg-console-window'
interface SavedState {
  x: number
  y: number
  w: number
  h: number
  collapsed: boolean
}
function loadSavedState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SavedState
  } catch {}
  return { x: 80, y: window.innerHeight - 500, w: 500, h: 350, collapsed: false }
}
function saveState(state: SavedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}
export function ConsoleWindow({ filterTags, setFilterTags, fontSize: externalFontSize, onChangeFontSize: externalOnChangeFontSize }: ConsoleWindowProps) {
  const initial = loadSavedState()
  const [position, setPosition] = useState({ x: initial.x, y: initial.y })
  const [size, setSize] = useState({ width: initial.w, height: initial.h })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [collapsed, setCollapsed] = useState(initial.collapsed)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [consoleHeight, setConsoleHeight] = useState(initial.h - 80)
  const windowRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef({ x: 0, y: 0, h: 0, w: 0 })
  const stateRef = useRef<SavedState>({ ...initial })
  const fontSize = externalFontSize ?? 11
  const onChangeFontSize = externalOnChangeFontSize ?? (() => {})
  const handleTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.cw-close-btn, .cw-collapse-btn')) return
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = { x: e.clientX, y: e.clientY, h: consoleHeight, w: size.width }
  }, [consoleHeight, size.width])
  useEffect(() => {
    if (!isDragging && !isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const nx = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 200))
        const ny = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100))
        setPosition({ x: nx, y: ny })
        stateRef.current.x = nx
        stateRef.current.y = ny
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.x
        const dy = e.clientY - resizeStartRef.current.y
        const nw = Math.max(300, resizeStartRef.current.w + dx)
        const nh = Math.max(150, resizeStartRef.current.h + dy)
        setSize({ width: nw, height: nh })
        setConsoleHeight(nh - 80)
        stateRef.current.w = nw
        stateRef.current.h = nh
      }
    }
    const handleMouseUp = () => {
      saveState(stateRef.current)
      setIsDragging(false)
      setIsResizing(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
  }, [isDragging, isResizing, dragOffset])
  const handleClose = useCallback(() => {
    window.dispatchEvent(new CustomEvent('debug:consoleDetach', { detail: false }))
  }, [])
  const toggleCollapse = useCallback(() => {
    setCollapsed(c => {
      stateRef.current.collapsed = !c
      saveState({ ...stateRef.current, collapsed: !c })
      return !c
    })
  }, [])
  const contentHeight = collapsed ? 0 : consoleHeight - 60
  return (
    <div
      ref={windowRef}
      className={`cw-window ${isDragging ? 'cw-dragging' : ''} ${collapsed ? 'cw-collapsed' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: collapsed ? 200 : size.width,
        height: collapsed ? 'auto' : size.height,
      }}
    >
      <div className='cw-title-bar' onMouseDown={handleTitleBarMouseDown}>
        <span className='cw-title'>Console</span>
        <div className='cw-title-buttons'>
          <button className='cw-collapse-btn' onClick={toggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '▹' : '▾'}
          </button>
          <button className='cw-close-btn' onClick={handleClose}>×</button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className='cw-content'>
            <LogConsole maxHeight={contentHeight} filterTags={filterTags} setFilterTags={setFilterTags} fontSize={fontSize} onChangeFontSize={onChangeFontSize} />
          </div>
          <div className='cw-resize-handle' onMouseDown={handleResizeMouseDown}>
            <div className='cw-resize-grip' />
          </div>
        </>
      )}
    </div>
  )
}
