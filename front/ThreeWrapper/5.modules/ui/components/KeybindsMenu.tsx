'use client'
import { useState } from 'react'
type KeyBinding = {
  action: string
  key: string
  altKey?: string
}
type KeybindsMenuProps = {
  bindings: KeyBinding[]
  onRebind: (action: string, key: string) => void
  onClose: () => void
}
export function KeybindsMenu({ bindings, onRebind, onClose }: KeybindsMenuProps) {
  const [listening, setListening] = useState<string | null>(null)
  function startListening(action: string) {
    setListening(action)
  }
  function handleKeyDown(e: React.KeyboardEvent, action: string) {
    if (listening !== action) return
    e.preventDefault()
    setListening(null)
    onRebind(action, e.code)
  }
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.65)',
      pointerEvents: 'auto',
    }}>
      {}
      <div style={{
        width: 420,
        maxHeight: 500,
        background: 'rgba(15, 15, 20, 0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        padding: 28,
        boxSizing: 'border-box',
        gap: 12,
      }}>
        {}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Keybinds</p>
          <button onClick={onClose} style={{ ...btnStyle, width: 'auto', padding: '4px 14px', fontSize: 13 }}>
            ✕
          </button>
        </div>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
        {}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bindings.map((b) => {
            const isListening = listening === b.action
            return (
              <div
                key={b.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isListening ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {}
                <span style={{ color: '#ccc', fontSize: 14 }}>{b.action}</span>
                {}
                <button
                  onClick={() => startListening(b.action)}
                  onKeyDown={(e) => handleKeyDown(e, b.action)}
                  style={{
                    ...keyBtnStyle,
                    outline: isListening ? '2px solid #6af' : 'none',
                    color: isListening ? '#6af' : '#fff',
                  }}
                >
                  {isListening ? '…' : (b.key ?? '—')}
                </button>
              </div>
            )
          })}
          {bindings.length === 0 && (
            <p style={{ color: '#666', fontSize: 13, textAlign: 'center', margin: '16px 0' }}>
              Aucun binding enregistré.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer',
}
const keyBtnStyle: React.CSSProperties = {
  minWidth: 90,
  padding: '5px 10px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6,
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'center',
}
