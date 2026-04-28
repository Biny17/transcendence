'use client'
type EscapeMenuProps = {
  onResume: () => void
  onKeybinds: () => void
  onReset?: () => void
}
export function EscapeMenu({ onResume, onKeybinds, onReset }: EscapeMenuProps) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.55)',
      pointerEvents: 'auto',
    }}>
      {}
      <div style={{
        width: 320,
        height: 400,
        background: 'rgba(15, 15, 20, 0.92)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        boxSizing: 'border-box',
      }}>
        {}
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
          Pause
        </p>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
        {}
        {}
        <button onClick={onResume} style={btnStyle}>
          Reprendre
        </button>
        <button onClick={onKeybinds} style={btnStyle}>
          Keybinds
        </button>
        {onReset && (
          <button onClick={onReset} style={btnStyle}>
            Reset
          </button>
        )}
        {}
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
