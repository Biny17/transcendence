'use client'
import { useCallback } from 'react'
import type { EngineState } from './DebugPanel'
interface EngineControlsSectionProps {
  engine: EngineState
  setEngineVal: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void
}
export function EngineControlsSection({ engine, setEngineVal }: EngineControlsSectionProps) {
  const handleQuickSave = useCallback(() => {
    setEngineVal('quickSaveRequested', true)
    setTimeout(() => setEngineVal('quickSaveRequested', false), 100)
  }, [setEngineVal])
  const handleQuickLoad = useCallback(() => {
    setEngineVal('quickLoadRequested', true)
    setTimeout(() => setEngineVal('quickLoadRequested', false), 100)
  }, [setEngineVal])
  return (
    <>
      <div className="dbg-subheader">Time Control</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Time Scale</label>
        <div className="dbg-slider-container">
          <input type="range" className="dbg-slider" min={0.1} max={4} step={0.1} value={engine.timeScale} onChange={e => setEngineVal('timeScale', parseFloat(e.target.value))} />
          <span className="dbg-slider-value">{engine.timeScale.toFixed(1)}x</span>
        </div>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Paused</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.paused} onChange={e => setEngineVal('paused', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <button className="dbg-btn" onClick={() => setEngineVal('stepRequested', true)}>Step Frame</button>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Game Tick Rate (ms)</label>
        <input type="number" className="dbg-number" min={0} max={100} value={engine.gameTickRate ?? 0} onChange={e => setEngineVal('gameTickRate', parseInt(e.target.value) || 0)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Freeze Frames</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.freezeFrames ?? false} onChange={e => setEngineVal('freezeFrames', e.target.checked)} />
      </div>
      <div className="dbg-subheader">Stats Overlay</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Position</label>
        <select
          className="dbg-select"
          value={engine.statsOverlayPos ?? 'top-right'}
          onChange={e => setEngineVal('statsOverlayPos' as keyof EngineState, e.target.value as EngineState[keyof EngineState])}
        >
          <option value="top-right">Top Right</option>
          <option value="top-left">Top Left</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
        </select>
      </div>
      <div className="dbg-subheader">Render Settings</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Wireframe</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.wireframe} onChange={e => setEngineVal('wireframe', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">No Textures</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.noTextures} onChange={e => setEngineVal('noTextures', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">No Post-Process</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.noPostProcess} onChange={e => setEngineVal('noPostProcess', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Grid</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.grid} onChange={e => setEngineVal('grid', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Shadows</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.shadows} onChange={e => setEngineVal('shadows', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Fog</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.fog} onChange={e => setEngineVal('fog', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Exposure</label>
        <div className="dbg-slider-container">
          <input type="range" className="dbg-slider" min={0.1} max={3} step={0.1} value={engine.exposure} onChange={e => setEngineVal('exposure', parseFloat(e.target.value))} />
          <span className="dbg-slider-value">{engine.exposure.toFixed(1)}</span>
        </div>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Ambient</label>
        <div className="dbg-slider-container">
          <input type="range" className="dbg-slider" min={0} max={1} step={0.05} value={engine.ambient} onChange={e => setEngineVal('ambient', parseFloat(e.target.value))} />
          <span className="dbg-slider-value">{engine.ambient.toFixed(2)}</span>
        </div>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">GI Enabled</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.giEnabled} onChange={e => setEngineVal('giEnabled', e.target.checked)} />
      </div>
      <div className="dbg-subheader">Physics Override</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Gravity Scale</label>
        <div className="dbg-slider-container">
          <input type="range" className="dbg-slider" min={0} max={5} step={0.1} value={engine.gravityScale} onChange={e => setEngineVal('gravityScale', parseFloat(e.target.value))} />
          <span className="dbg-slider-value">{engine.gravityScale.toFixed(1)}</span>
        </div>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Sub-stepping</label>
        <div className="dbg-slider-container">
          <input type="range" className="dbg-slider" min={1} max={8} step={1} value={engine.subStepping} onChange={e => setEngineVal('subStepping', parseInt(e.target.value))} />
          <span className="dbg-slider-value">{engine.subStepping}</span>
        </div>
      </div>
      <div className="dbg-subheader">Cheats</div>
      <div className="dbg-control">
        <label className="dbg-control-label">God Mode</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.godMode} onChange={e => setEngineVal('godMode', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Noclip</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.noclip} onChange={e => setEngineVal('noclip', e.target.checked)} />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Infinite Resources</label>
        <input type="checkbox" className="dbg-checkbox" checked={engine.infiniteResources} onChange={e => setEngineVal('infiniteResources', e.target.checked)} />
      </div>
      <div className="dbg-subheader">Quick Save / Load</div>
      <div className="dbg-control">
        <button className="dbg-btn" onClick={handleQuickSave}>Quick Save</button>
        <button className="dbg-btn" onClick={handleQuickLoad}>Quick Load</button>
      </div>
    </>
  )
}
