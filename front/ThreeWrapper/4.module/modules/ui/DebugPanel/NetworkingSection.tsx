'use client'
import { useState, useEffect } from 'react'
import { networkLogger, ALL_PACKET_TYPES, ALL_PACKET_TYPE_STRINGS, FAKE_MESSAGES } from '../../debug/NetworkLogger'
import type { PacketEntry, PacketState } from '../../debug/NetworkLogger'
import { CLIENT_MSG, SERVER_MSG } from 'shared/protocol'
export function NetworkingSection() {
  const [packets, setPackets] = useState<PacketEntry[]>([])
  const [filterDir, setFilterDir] = useState<'ALL' | 'incoming' | 'outgoing'>('ALL')
  const [filterText, setFilterText] = useState('')
  const [fakeMessageIdx, setFakeMessageIdx] = useState(0)
  const [customPayload, setCustomPayload] = useState('')
  const [customType, setCustomType] = useState('')
  const [captureEnabled, setCaptureEnabled] = useState(() => localStorage.getItem('debugNetworkEnabled') === 'true')
  const [logMode, setLogMode] = useState<'all' | 'selected'>(() => networkLogger.getLogMode())
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => networkLogger.getSelectedTypes())
  const [selectedDirections, setSelectedDirections] = useState<Array<'incoming' | 'outgoing'>>(() => networkLogger.getSelectedDirections())
  const [simLag, setSimLag] = useState(0)
  const [simLoss, setSimLoss] = useState(0)
  const [simDup, setSimDup] = useState(0)
  const [packetStates, setPacketStates] = useState<Map<string, PacketState>>(() => networkLogger.getPacketStates())
  useEffect(() => {
    const sync = () => setPackets([...networkLogger.getPackets()])
    window.addEventListener('debug:network', sync)
    sync()
    return () => window.removeEventListener('debug:network', sync)
  }, [])
  const handleCaptureChange = (enabled: boolean) => {
    setCaptureEnabled(enabled)
    localStorage.setItem('debugNetworkEnabled', String(enabled))
    networkLogger.setEnabled(enabled)
  }
  const handleLogModeChange = (mode: 'all' | 'selected') => {
    setLogMode(mode)
    networkLogger.setLogMode(mode)
  }
  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(newTypes)
    networkLogger.setSelectedTypes(newTypes)
  }
  const handleSelectAllTypes = () => {
    const newTypes = ALL_PACKET_TYPE_STRINGS
    setSelectedTypes(newTypes)
    networkLogger.setSelectedTypes(newTypes)
  }
  const handleDeselectAllTypes = () => {
    const newTypes: string[] = []
    setSelectedTypes(newTypes)
    networkLogger.setSelectedTypes(newTypes)
  }
  const handleFakeMessageChange = (idx: number) => {
    setFakeMessageIdx(idx)
    if (idx !== 0) {
      const msg = FAKE_MESSAGES[idx]
      setCustomPayload(msg?.defaultPayload ?? '{}')
    }
  }
  const handleDirectionToggle = (direction: 'incoming' | 'outgoing') => {
    const newDirs = selectedDirections.includes(direction)
      ? selectedDirections.filter(d => d !== direction)
      : [...selectedDirections, direction]
    if (newDirs.length === 0) return
    setSelectedDirections(newDirs)
    networkLogger.setSelectedDirections(newDirs)
  }
  const cyclePacketState = (type: string) => {
    const current = packetStates.get(type) ?? 'allow'
    const next: PacketState = current === 'allow' ? 'hide' : current === 'hide' ? 'block' : 'allow'
    networkLogger.setPacketState(type, next)
    setPacketStates(new Map(networkLogger.getPacketStates()))
  }
  const handleClearPacketStates = () => {
    networkLogger.clearPacketStates()
    setPacketStates(new Map())
  }
  const getStateCount = (state: PacketState) => {
    let count = 0
    packetStates.forEach(v => { if (v === state) count++ })
    return count
  }
  const currentMsg = FAKE_MESSAGES[fakeMessageIdx]
  const isCustom = fakeMessageIdx === 0
  const filtered = packets.filter(p => {
    if (filterDir !== 'ALL' && p.direction !== filterDir) return false
    if (filterText && !p.type.includes(filterText) && !JSON.stringify(p.payload).includes(filterText)) return false
    return true
  })
  const handleClear = () => networkLogger.clearPackets()
  const handleExport = () => {
    const json = JSON.stringify(packets, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const a = document.createElement('a')
    a.href = url
    a.download = `network_${ts}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleFakeSend = () => {
    const msg = FAKE_MESSAGES[fakeMessageIdx]
    const type = msg?.type || customType.trim()
    if (!type) return
    let payload: unknown
    try {
      payload = customPayload.trim() ? JSON.parse(customPayload) : {}
    } catch {
      payload = customPayload
    }
    if (msg?.direction === 'outgoing' || (!msg && fakeMessageIdx === 0)) {
      networkLogger.sendRealOutgoing(type, payload)
    } else {
      networkLogger.fakeIncoming(type, payload)
    }
  }
  const handleQuickSend = (msg: typeof FAKE_MESSAGES[number]) => {
    if (!msg.type) return
    const payload = JSON.parse(msg.defaultPayload)
    if (msg.direction === 'outgoing') {
      networkLogger.sendRealOutgoing(msg.type, payload)
    } else {
      networkLogger.fakeIncoming(msg.type, payload)
    }
  }
  const quickMessages: typeof FAKE_MESSAGES = [
    FAKE_MESSAGES.find(m => m.type === CLIENT_MSG.PLAYER_READY)!,
    FAKE_MESSAGES.find(m => m.type === SERVER_MSG.LOAD_WORLD)!,
    FAKE_MESSAGES.find(m => m.type === SERVER_MSG.START_WORLD)!,
    FAKE_MESSAGES.find(m => m.type === SERVER_MSG.CONNECTED)!,
    FAKE_MESSAGES.find(m => m.type === SERVER_MSG.PHASE_EVENT && m.defaultPayload.includes('player_won'))!,
    FAKE_MESSAGES.find(m => m.type === CLIENT_MSG.RESET)!,
  ].filter(Boolean)
  return (
    <>
      <div className="dbg-control">
        <label className="dbg-control-label">Capture</label>
        <input
          type="checkbox"
          className="dbg-checkbox"
          checked={captureEnabled}
          onChange={e => handleCaptureChange(e.target.checked)}
        />
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Buffer (max)</label>
        <div className="dbg-slider-container">
          <input
            type="range" className="dbg-slider" min={10} max={500} step={10}
            value={networkLogger['maxPackets']}
            onChange={e => networkLogger.setMaxPackets(parseInt(e.target.value))}
          />
          <span className="dbg-slider-value">{networkLogger.getPacketCount()} / {networkLogger['maxPackets']}</span>
        </div>
      </div>
      <div className="dbg-subheader">Capture Filter</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Log Mode</label>
        <select
          className="dbg-select"
          value={logMode}
          onChange={e => handleLogModeChange(e.target.value as 'all' | 'selected')}
        >
          <option value="all">All Packet Types</option>
          <option value="selected">Selected Types Only</option>
        </select>
      </div>
      {logMode === 'selected' && (
        <div className="dbg-control">
          <div className="dbg-control-label">Packet Types</div>
          <div className="dbg-type-select-buttons">
            <button className="dbg-btn" onClick={handleSelectAllTypes}>All</button>
            <button className="dbg-btn" onClick={handleDeselectAllTypes}>None</button>
          </div>
          <div className="dbg-type-list">
            {ALL_PACKET_TYPE_STRINGS.map(type => (
              <label key={type} className="dbg-type-item">
                <input
                  type="checkbox"
                  className="dbg-checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                />
                <span className="dbg-type-label">{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="dbg-control">
        <div className="dbg-control-label">Direction</div>
        <div className="dbg-direction-toggles">
          <label className="dbg-type-item">
            <input
              type="checkbox"
              className="dbg-checkbox"
              checked={selectedDirections.includes('incoming')}
              onChange={() => handleDirectionToggle('incoming')}
            />
            <span className="dbg-type-label">Incoming (←)</span>
          </label>
          <label className="dbg-type-item">
            <input
              type="checkbox"
              className="dbg-checkbox"
              checked={selectedDirections.includes('outgoing')}
              onChange={() => handleDirectionToggle('outgoing')}
            />
            <span className="dbg-type-label">Outgoing (→)</span>
          </label>
        </div>
      </div>
      <div className="dbg-subheader">Simulation Tools</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Simulate Lag (ms)</label>
        <div className="dbg-slider-container">
          <input
            type="range"
            className="dbg-slider"
            min={0}
            max={1000}
            step={50}
            value={simLag}
            onChange={e => {
              const val = parseInt(e.target.value);
              setSimLag(val);
              window.__networkMgr?.setSimulateLag(val);
            }}
          />
          <span className="dbg-slider-value">{simLag}ms</span>
        </div>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Simulate Packet Loss (%)</label>
        <div className="dbg-slider-container">
          <input
            type="range"
            className="dbg-slider"
            min={0}
            max={100}
            step={1}
            value={simLoss}
            onChange={e => {
              const val = parseInt(e.target.value);
              setSimLoss(val);
              window.__networkMgr?.setSimulatePacketLoss(val);
            }}
          />
          <span className="dbg-slider-value">{simLoss}%</span>
        </div>
      </div>
      <div className="dbg-control">
        <label className="dbg-control-label">Simulate Packet Duplication</label>
        <div className="dbg-slider-container">
          <input
            type="range"
            className="dbg-slider"
            min={0}
            max={5}
            step={1}
            value={simDup}
            onChange={e => {
              const val = parseInt(e.target.value);
              setSimDup(val);
              window.__networkMgr?.setSimulatePacketDuplication(val);
            }}
          />
          <span className="dbg-slider-value">{simDup}x</span>
        </div>
      </div>
      <div className="dbg-control">
        <button className="dbg-btn" onClick={() => { 
          console.log('[DebugPanel] forceDisconnectAndReconnect clicked'); 
          if (window.__serverHandler) {
            window.__serverHandler.forceDisconnectAndReconnect();
          } else {
            window.__networkMgr?.forceDisconnectAndReconnect?.();
          }
        }}>
          Force Disconnect / Reconnect
        </button>
      </div>
      <div className="dbg-subheader">Packet Filter</div>
      <div className="dbg-control">
        <div className="dbg-blocked-hint">Click to cycle: allow → hide → block → allow</div>
      </div>
      <div className="dbg-control">
        <div className="dbg-packet-type-section">
          <div className="dbg-packet-type-group">
            <div className="dbg-packet-type-group-label">Incoming (Server → Client)</div>
            <div className="dbg-packet-type-list">
              {ALL_PACKET_TYPES.incoming.map(type => (
                <button
                  key={type}
                  className={`dbg-packet-type-btn ${packetStates.get(type) ?? 'allow'}`}
                  onClick={() => cyclePacketState(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="dbg-packet-type-group">
            <div className="dbg-packet-type-group-label">Outgoing (Client → Server)</div>
            <div className="dbg-packet-type-list">
              {ALL_PACKET_TYPES.outgoing.map(type => (
                <button
                  key={type}
                  className={`dbg-packet-type-btn ${packetStates.get(type) ?? 'allow'}`}
                  onClick={() => cyclePacketState(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {(getStateCount('hide') > 0 || getStateCount('block') > 0) && (
        <div className="dbg-control">
          <div className="dbg-blocked-summary">
            <span>Hidden: {getStateCount('hide')} | Blocked: {getStateCount('block')}</span>
            <button className="dbg-btn" onClick={handleClearPacketStates}>Clear All</button>
          </div>
        </div>
      )}
      <div className="dbg-subheader">Quick Send</div>
      <div className="dbg-control">
        <div className="dbg-quick-send-grid">
          {quickMessages.map((msg, i) => (
            <button
              key={i}
              className="dbg-btn dbg-btn-small"
              onClick={() => handleQuickSend(msg)}
              title={msg.defaultPayload}
            >
              {msg.label}
            </button>
          ))}
        </div>
      </div>
      <div className="dbg-subheader">Fake Message</div>
      <div className="dbg-control">
        <select
          className="dbg-select"
          value={fakeMessageIdx}
          onChange={e => handleFakeMessageChange(parseInt(e.target.value))}
        >
          {FAKE_MESSAGES.map((msg, i) => (
            <option key={i} value={i}>{msg.label}</option>
          ))}
        </select>
      </div>
      {isCustom && (
        <div className="dbg-control">
          <input
            type="text" className="dbg-text" placeholder="Custom message type..."
            value={customType} onChange={e => setCustomType(e.target.value)}
          />
        </div>
      )}
      <div className="dbg-control">
        <textarea
          className="dbg-textarea"
          rows={3}
          placeholder="Payload (JSON)"
          value={customPayload}
          onChange={e => setCustomPayload(e.target.value)}
        />
      </div>
      <div className="dbg-control">
        <button className="dbg-btn" onClick={handleFakeSend}>Send {currentMsg?.direction === 'incoming' ? '← IN (fake)' : '→ OUT (real)'}</button>
      </div>
    </>
  )
}
