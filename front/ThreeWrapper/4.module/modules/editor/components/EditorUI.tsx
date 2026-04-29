'use client'
import { useState, useEffect, useRef } from 'react'
export type EditorUIState = {
  canUndo: boolean
  canRedo: boolean
  placedCount: number
  placementY: number
  selectedRotation: { x: number; y: number; z: number } | null
  selectedAnimations: string[]
  playingAnimationName: string | null
  isPlayingAll: boolean
  hasAnyAnimations: boolean
  env: { sky: any; fog: any; lights: any[]; clouds: boolean }
}
type Props = {
  components: string[]
  onSelect: (path: string) => void
  onDeselect: () => void
  onLoadMap: (yamlText: string) => void
  onMount: (updater: (state: EditorUIState) => void) => void
  onRotationChange: (rot: { x: number; y: number; z: number }) => void
  onPlayAnimation: (name: string) => void
  onStopAnimation: () => void
  onPlayAll: () => void
  onStopAll: () => void
  onEnvChange: (env: { sky: any; fog: any; lights: any[]; clouds: boolean }) => void
}
const C = {
  bg: 'rgba(10, 10, 28, 0.88)',
  border: 'rgba(68, 170, 255, 0.2)',
  text: '#aac8ee',
  textDim: '#557799',
  textBright: '#88ccff',
  accent: '#44aaff',
  selectedBg: 'rgba(68,170,255,0.18)',
  btnBg: 'rgba(68,170,255,0.12)',
  btnBorder: 'rgba(68,170,255,0.35)',
  btnDisabledText: '#334455',
  btnDisabledBorder: 'rgba(68,170,255,0.1)',
}
function componentName(path: string): string {
  return path.split('/').pop()?.replace(/\.ya?ml$/i, '') ?? path
}
function Btn({
  onClick, disabled, children, style,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '6px 4px',
        background: disabled ? 'transparent' : C.btnBg,
        border: `1px solid ${disabled ? C.btnDisabledBorder : C.btnBorder}`,
        borderRadius: '3px',
        color: disabled ? C.btnDisabledText : C.textBright,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.04em',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
export function EditorUI({
  components, onSelect, onDeselect, onExport,
  onUndo, onRedo, onDelete, onHeightChange, onLoadMap, onMount,
  onRotationChange, onPlayAnimation, onStopAnimation,
  onPlayAll, onStopAll, onEnvChange,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [envOpen, setEnvOpen] = useState(false)
  const [state, setState] = useState<EditorUIState>({
    canUndo: false, canRedo: false, placedCount: 0, placementY: 0,
    selectedRotation: null, selectedAnimations: [], playingAnimationName: null,
    isPlayingAll: false, hasAnyAnimations: false,
    env: { sky: null, fog: null, lights: [], clouds: false },
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    onMount(setState)
  }, [])
  function handleComponentClick(path: string) {
    if (selected === path) {
      setSelected(null)
      onDeselect()
    } else {
      setSelected(path)
      onSelect(path)
    }
  }
  function handleHeightInput(raw: string) {
    const v = parseFloat(raw)
    if (!isNaN(v)) onHeightChange(v)
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result
      if (typeof text === 'string') onLoadMap(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  const sectionBorder: React.CSSProperties = {
    borderTop: `1px solid ${C.border}`,
    padding: '8px 12px',
  }
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '6px',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: C.textDim,
    marginBottom: '4px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }
  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    border: `1px solid ${C.btnBorder}`,
    borderRadius: '3px',
    color: C.textBright,
    fontFamily: 'monospace',
    fontSize: '11px',
    padding: '4px 6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
  const handleEnvChange = (updates: Partial<typeof state.env>) => {
    const newEnv = { ...state.env, ...updates }
    onEnvChange(newEnv)
  }
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '200px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: C.text,
      userSelect: 'none',
    }}>
      {}
      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', color: C.accent, textTransform: 'uppercase' }}>
        Map Editor
      </div>
      {}
      {}
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <div
          onClick={() => setEnvOpen(v => !v)}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '11px',
            color: C.textBright,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {envOpen ? '▼' : '▶'} Environment
        </div>
        {envOpen && (
          <div style={{ padding: '8px 12px', fontSize: '10px' }}>
            {}
            <div style={{ marginBottom: '8px' }}>
              <div style={labelStyle}>Sky</div>
              <select
                value={state.env.sky?.preset || 'none'}
                onChange={(e) => {
                  if (e.target.value === 'none') handleEnvChange({ sky: null })
                  else handleEnvChange({ sky: { preset: e.target.value } })
                }}
                style={inputStyle}
              >
                <option value="none">None</option>
                <option value="day">Day Preset</option>
              </select>
            </div>
            {}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={state.env.clouds}
                  onChange={(e) => handleEnvChange({ clouds: e.target.checked })}
                />
                <span>Cloud Overlay</span>
              </label>
            </div>
            {}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!state.env.fog}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleEnvChange({ fog: { kind: 'linear', color: 0x808080, near: 10, far: 200 } })
                    } else {
                      handleEnvChange({ fog: null })
                    }
                  }}
                />
                <span>Fog</span>
              </label>
              {state.env.fog && (
                <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <select
                    value={state.env.fog.kind || 'linear'}
                    onChange={(e) => handleEnvChange({ fog: { ...state.env.fog!, kind: e.target.value as any } })}
                    style={inputStyle}
                  >
                    <option value="linear">Linear</option>
                    <option value="exponential">Exponential</option>
                  </select>
                  {state.env.fog.kind !== 'exponential' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="Near"
                          value={state.env.fog.near || 10}
                          onChange={(e) =>
                            handleEnvChange({
                              fog: { ...state.env.fog!, near: parseFloat(e.target.value) || 10 },
                            })
                          }
                          style={inputStyle}
                        />
                        <input
                          type="number"
                          placeholder="Far"
                          value={state.env.fog.far || 200}
                          onChange={(e) =>
                            handleEnvChange({
                              fog: { ...state.env.fog!, far: parseFloat(e.target.value) || 200 },
                            })
                          }
                          style={inputStyle}
                        />
                      </div>
                    </>
                  )}
                  {state.env.fog.kind === 'exponential' && (
                    <input
                      type="number"
                      placeholder="Density"
                      step="0.001"
                      value={state.env.fog.density || 0.01}
                      onChange={(e) =>
                        handleEnvChange({
                          fog: { ...state.env.fog!, density: parseFloat(e.target.value) || 0.01 },
                        })
                      }
                      style={inputStyle}
                    />
                  )}
                </div>
              )}
            </div>
            {}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={labelStyle}>Lights</div>
                <button
                  onClick={() => {
                    const newLight = { type: 'ambient', color: 0xffffff, intensity: 0.5 }
                    handleEnvChange({ lights: [...state.env.lights, newLight as any] })
                  }}
                  style={{
                    background: C.btnBg,
                    border: `1px solid ${C.btnBorder}`,
                    borderRadius: '2px',
                    color: C.textBright,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontFamily: 'monospace',
                    fontSize: '9px',
                  }}
                >
                  +
                </button>
              </div>
              {state.env.lights.map((light, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
                  <select
                    value={light.type}
                    onChange={(e) => {
                      const updated = [...state.env.lights]
                      updated[idx] = { ...light, type: e.target.value as any }
                      handleEnvChange({ lights: updated })
                    }}
                    style={{ ...inputStyle, flex: 1, fontSize: '10px' }}
                  >
                    <option value="ambient">Ambient</option>
                    <option value="directional">Directional</option>
                    <option value="point">Point</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Intensity"
                    step="0.1"
                    value={light.intensity || 1}
                    onChange={(e) => {
                      const updated = [...state.env.lights]
                      updated[idx] = { ...light, intensity: parseFloat(e.target.value) || 1 }
                      handleEnvChange({ lights: updated })
                    }}
                    style={{ ...inputStyle, width: '60px', fontSize: '10px' }}
                  />
                  <button
                    onClick={() => {
                      const updated = state.env.lights.filter((_, i) => i !== idx)
                      handleEnvChange({ lights: updated })
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff8844',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {}
      <div style={{ padding: '5px 12px', borderBottom: `1px solid ${C.border}`, fontSize: '10px', color: C.textDim }}>
        {state.placedCount} object{state.placedCount !== 1 ? 's' : ''} placed
        {selected && <span style={{ color: C.textBright, display: 'block' }}>▸ {componentName(selected)}</span>}
      </div>
      {}
      <div style={{ flex: '0 0 auto', maxHeight: '240px', overflowY: 'auto', borderBottom: `1px solid ${C.border}`, padding: '6px 0' }}>
        <div style={{ padding: '2px 12px 4px', fontSize: '10px', color: C.textDim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Components</div>
        {components.map(path => {
          const isSel = selected === path
          return (
            <div
              key={path}
              onClick={() => handleComponentClick(path)}
              style={{
                padding: '6px 14px',
                cursor: 'pointer',
                background: isSel ? C.selectedBg : 'transparent',
                borderLeft: `3px solid ${isSel ? C.accent : 'transparent'}`,
                color: isSel ? C.textBright : C.text,
                fontSize: '12px',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'rgba(68,170,255,0.07)' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {componentName(path)}
            </div>
          )
        })}
      </div>
      {}
      <div style={sectionBorder}>
        <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Height (Y)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onHeightChange(Math.round((state.placementY - 0.5) * 10) / 10)}
            style={{ width: '24px', height: '24px', background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: '3px', color: C.textBright, cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px', lineHeight: 1, padding: 0 }}
          >−</button>
          <input
            type="number"
            value={state.placementY}
            step={0.5}
            onChange={e => handleHeightInput(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${C.btnBorder}`,
              borderRadius: '3px',
              color: C.textBright,
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '3px 6px',
              textAlign: 'center',
              outline: 'none',
              width: 0,
            }}
          />
          <button
            onClick={() => onHeightChange(Math.round((state.placementY + 0.5) * 10) / 10)}
            style={{ width: '24px', height: '24px', background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: '3px', color: C.textBright, cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px', lineHeight: 1, padding: 0 }}
          >+</button>
        </div>
      </div>
      {}
      {state.selectedRotation && (
        <div style={sectionBorder}>
          <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rotation (°)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis}>
                <div style={{ fontSize: '9px', color: C.textDim, textAlign: 'center', marginBottom: '2px' }}>{axis.toUpperCase()}</div>
                <input
                  type="number" step={15}
                  value={Math.round(state.selectedRotation![axis])}
                  onChange={e => {
                    let v = parseFloat(e.target.value) || 0
                    onRotationChange({ ...state.selectedRotation!, [axis]: v })
                  }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.btnBorder}`,
                    borderRadius: '3px', color: C.textBright, fontFamily: 'monospace', fontSize: '11px',
                    padding: '3px 4px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '6px', display: 'flex', gap: '2px', justifyContent: 'center' }}>
            <button onClick={() => onRotationChange({ ...state.selectedRotation!, y: (state.selectedRotation!.y - 45) })}
              style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: '2px', color: C.textBright, cursor: 'pointer', flex: 1, fontSize: '9px', padding: '2px', outline: 'none' }}>← -45°</button>
            <button onClick={() => onRotationChange({ ...state.selectedRotation!, y: (state.selectedRotation!.y + 45) })}
              style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: '2px', color: C.textBright, cursor: 'pointer', flex: 1, fontSize: '9px', padding: '2px', outline: 'none' }}>+45° →</button>
          </div>
        </div>
      )}
      {}
{state.hasAnyAnimations && (
        <div style={sectionBorder}>
          <div style={rowStyle}>
            <Btn onClick={() => (state.isPlayingAll ? onStopAll() : onPlayAll())}>
              {state.isPlayingAll ? '■ Stop All' : '▶ Play All'}
            </Btn>
          </div>
        </div>
      )}
      {}
      {state.selectedAnimations.length > 0 && (
        <div style={sectionBorder}>
          <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Animations</div>
          {state.selectedAnimations.map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ flex: 1, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <button
                onClick={() => state.playingAnimationName === name ? onStopAnimation() : onPlayAnimation(name)}
                style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: '3px',
                  color: C.textBright, cursor: 'pointer', padding: '2px 8px', fontFamily: 'monospace', fontSize: '11px' }}>
                {state.playingAnimationName === name ? '■' : '▶'}
              </button>
            </div>
          ))}
        </div>
      )}
      {}
      <div style={{ ...sectionBorder }}>
        <div style={rowStyle}>
          <Btn onClick={onUndo} disabled={!state.canUndo}>⟲ Undo</Btn>
          <Btn onClick={onRedo} disabled={!state.canRedo}>⟳ Redo</Btn>
        </div>
      </div>
      {}
      <div style={{ ...sectionBorder }}>
        <div style={rowStyle}>
          <Btn onClick={() => fileInputRef.current?.click()}>Load Map</Btn>
          <Btn onClick={onDelete}>Delete</Btn>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {}
      <div style={{ ...sectionBorder, marginTop: 'auto' }}>
        <Btn onClick={onExport} style={{ width: '100%', flex: 'none', padding: '7px 0' }}>
          Export YAML
        </Btn>
      </div>
    </div>
  )
}
