'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { traceRecorder } from '../../debug/TraceRecorder'
import { FAKE_MESSAGES } from '../../debug/NetworkLogger'
type RecordType = 'startNow' | 'untilEvent' | 'nextNFrames' | 'manual'
type ExportFormat = 'json' | 'html'
const USEFUL_FILTER_PRESET = {
  levels: ['INFO', 'WARN', 'ERROR'] as Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>,
  namespaces: undefined,
  contains: undefined,
}
const ALL_EVENTS = FAKE_MESSAGES.filter((m: { type: string }) => m.type !== '').map((m: { label: string; type: string }) => ({ label: m.label, type: m.type }))
export function PerfectTraceSection() {
  const [recording, setRecording] = useState(false)
  const [recordType, setRecordType] = useState<RecordType>('startNow')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [frameLimit, setFrameLimit] = useState(100)
  const [onlyUseful, setOnlyUseful] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [entries, setEntries] = useState(traceRecorder.getEntries())
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('ALL')
  const [filterNs, setFilterNs] = useState('')
  const [filterContains, setFilterContains] = useState('')
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null)
  const [recordEndEvent, setRecordEndEvent] = useState<string | null>(null)
  const [currentFrameCount, setCurrentFrameCount] = useState(0)
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventListenerRef = useRef<((e: Event) => void) | null>(null)
  useEffect(() => {
    const sync = () => setEntries([...traceRecorder.getEntries()])
    window.addEventListener('debug:logs', sync)
    return () => window.removeEventListener('debug:logs', sync)
  }, [])
  const stopRecording = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    if (eventListenerRef.current) {
      window.removeEventListener('debug:event', eventListenerRef.current)
      eventListenerRef.current = null
    }
    const result = traceRecorder.stop()
    setRecording(false)
    setEntries([...result])
    setRecordStartTime(null)
    setRecordEndEvent(null)
    setCurrentFrameCount(0)
  }, [])
  const handleStart = useCallback(() => {
    const useUseful = onlyUseful
    const allLevels: Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const selectedLevels = allLevels.filter(l => filterLevel === 'ALL' || l === filterLevel)
    const filters = useUseful
      ? USEFUL_FILTER_PRESET
      : {
          levels: filterLevel === 'ALL' ? undefined : (selectedLevels as Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>),
          namespaces: filterNs ? filterNs.split(',').map(s => s.trim()) : undefined,
          contains: filterContains || undefined,
        }
    traceRecorder.start(filters)
    setRecording(true)
    setEntries([])
    setCurrentFrameCount(0)
    if (recordType === 'nextNFrames') {
      setRecordStartTime(Date.now())
      frameIntervalRef.current = setInterval(() => {
        setCurrentFrameCount(prev => {
          const next = prev + 1
          if (next >= frameLimit) {
            stopRecording()
          }
          return next
        })
      }, 1000 / 60)
    } else if (recordType === 'untilEvent' && selectedEvent) {
      setRecordStartTime(Date.now())
      setRecordEndEvent(selectedEvent)
      eventListenerRef.current = (e: Event) => {
        const ce = e as CustomEvent<{ type: string }>
        if (ce.detail?.type === selectedEvent) {
          stopRecording()
        }
      }
      window.addEventListener('debug:event', eventListenerRef.current)
    } else if (recordType === 'startNow' || recordType === 'manual') {
      setRecordStartTime(Date.now())
    }
  }, [onlyUseful, filterLevel, filterNs, filterContains, recordType, selectedEvent, frameLimit, stopRecording])
  const handleStop = useCallback(() => {
    stopRecording()
  }, [stopRecording])
  const handleClear = useCallback(() => {
    traceRecorder.clear()
    setEntries([])
  }, [])
  const generateHtmlReport = useCallback((data: typeof entries): string => {
    const duration = recordStartTime ? (Date.now() - recordStartTime) : 0
    const startTime = data.length > 0 ? data[0].timestamp : Date.now()
    const endTime = data.length > 0 ? data[data.length - 1].timestamp : Date.now()
    const totalDuration = endTime - startTime || 1
    const timelineEvents = data.filter(e => e.level === 'ERROR' || e.level === 'WARN').slice(0, 20) 
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Perfect Trace Report</title>
  <style>
    body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; padding: 20px; }
    h1 { color: #4a9eff; }
    .summary { background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .summary-item { margin: 5px 0; }
    .timeline { position: relative; height: 50px; background: #111; margin: 20px 0; border-radius: 4px; overflow: hidden; }
    .timeline-event { position: absolute; top: 0; height: 100%; width: 2px; }
    .timeline-event-error { background: #e54545; }
    .timeline-event-warn { background: #f5a623; }
    .timeline-event-info { background: #4a9eff; }
    .entry { padding: 8px; margin: 4px 0; border-radius: 4px; cursor: pointer; }
    .entry-debug { background: #2a2a3e; }
    .entry-info { background: #1a3a5c; }
    .entry-warn { background: #4a3a1a; }
    .entry-error { background: #4a1a1a; }
    .timestamp { color: #888; margin-right: 10px; }
    .namespace { color: #4a9eff; margin-right: 10px; }
    .level { font-weight: bold; margin-right: 10px; }
    .level-debug { color: #606080; }
    .level-info { color: #4a9eff; }
    .level-warn { color: #f5a623; }
    .level-error { color: #e54545; }
    .msg { color: #e0e0e0; }
    .data { color: #888; font-size: 0.9em; margin-top: 4px; white-space: pre-wrap; display: none; }
    .stack { color: #666; font-size: 0.8em; margin-top: 4px; white-space: pre-wrap; display: none; }
    .entry.expanded .data { display: block; }
    .entry.expanded .stack { display: block; }
  </style>
  <script>
    function toggleExpand(id) {
      const el = document.getElementById('entry-' + id);
      el.classList.toggle('expanded');
    }
  </script>
</head>
<body>
  <h1>Perfect Trace Timeline Report</h1>
  <div class="summary">
    <div class="summary-item"><strong>Duration:</strong> ${duration}ms</div>
    <div class="summary-item"><strong>Total Entries:</strong> ${data.length}</div>
    <div class="summary-item"><strong>Generated:</strong> ${new Date().toISOString()}</div>
    ${recordEndEvent ? `<div class="summary-item"><strong>End Event:</strong> ${recordEndEvent}</div>` : ''}
  </div>
  <div class="timeline">
    ${timelineEvents.map((e, i) => {
      const left = ((e.timestamp - startTime) / totalDuration) * 100
      return `<div class="timeline-event timeline-event-${e.level.toLowerCase()}" style="left: ${left}%"></div>`
    }).join('')}
  </div>
  <div class="entries">
    ${data.map((e, i) => `
    <div id="entry-${i}" class="entry entry-${e.level.toLowerCase()}" onclick="toggleExpand(${i})">
      <span class="timestamp">${new Date(e.timestamp).toISOString()}</span>
      <span class="namespace">[${e.namespace}]</span>
      <span class="level level-${e.level.toLowerCase()}">${e.level}</span>
      <span class="msg">${e.msg}</span>
      ${e.data ? `<div class="data">${JSON.stringify(e.data, null, 2)}</div>` : ''}
      ${e.stack ? `<div class="stack">${e.stack}</div>` : ''}
    </div>`).join('')}
  </div>
</body>
</html>`
    return html
  }, [recordStartTime, recordEndEvent])
  const handleExport = useCallback(() => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    if (exportFormat === 'html') {
      const html = generateHtmlReport(entries)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trace_${ts}.html`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const json = JSON.stringify(entries, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trace_${ts}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [entries, exportFormat, generateHtmlReport])
  const filtered = entries.filter(e => {
    if (filterLevel !== 'ALL' && e.level !== filterLevel) return false
    if (filterNs && !e.namespace.includes(filterNs)) return false
    if (filterContains && !e.msg.includes(filterContains) && !JSON.stringify(e.data ?? {}).includes(filterContains)) return false
    return true
  })
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      if (eventListenerRef.current) window.removeEventListener('debug:event', eventListenerRef.current)
    }
  }, [])
  return (
    <>
      <div className="dbg-subheader">Recording Mode</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Record Type</label>
        <select
          className="dbg-select"
          value={recordType}
          onChange={e => setRecordType(e.target.value as RecordType)}
          disabled={recording}
        >
          <option value="startNow">Start Now</option>
          <option value="untilEvent">Until Next Event</option>
          <option value="nextNFrames">Next N Frames</option>
          <option value="manual">Manual Stop</option>
        </select>
      </div>
      {recordType === 'untilEvent' && (
        <div className="dbg-control">
          <label className="dbg-control-label">Stop Event</label>
          <select
            className="dbg-select"
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            disabled={recording}
          >
            <option value="">Select event...</option>
            {ALL_EVENTS.map(ev => (
              <option key={ev.type} value={ev.type}>{ev.label}</option>
            ))}
          </select>
        </div>
      )}
      {recordType === 'nextNFrames' && (
        <div className="dbg-control">
          <label className="dbg-control-label">Frame Count</label>
          <input
            type="number"
            className="dbg-number"
            min={1}
            max={10000}
            value={frameLimit}
            onChange={e => setFrameLimit(parseInt(e.target.value) || 100)}
            disabled={recording}
          />
        </div>
      )}
      <div className="dbg-control">
        <label className="dbg-control-label">Only Useful Information</label>
        <input
          type="checkbox"
          className="dbg-checkbox"
          checked={onlyUseful}
          onChange={e => setOnlyUseful(e.target.checked)}
          disabled={recording}
        />
      </div>
      {!onlyUseful && (
        <>
          <div className="dbg-subheader">Filters</div>
          <div className="dbg-control">
            <label className="dbg-control-label">Filter Level</label>
            <select className="dbg-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value as typeof filterLevel)}>
              <option value="ALL">ALL</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <div className="dbg-control">
            <label className="dbg-control-label">Namespace</label>
            <input
              type="text" className="dbg-text" placeholder="filter,by,ns"
              value={filterNs} onChange={e => setFilterNs(e.target.value)}
            />
          </div>
          <div className="dbg-control">
            <label className="dbg-control-label">Contains</label>
            <input
              type="text" className="dbg-text" placeholder="contains..."
              value={filterContains} onChange={e => setFilterContains(e.target.value)}
            />
          </div>
        </>
      )}
      <div className="dbg-control">
        {recording
          ? <button className="dbg-btn dbg-btn-active" onClick={handleStop}>■ Stop</button>
          : <button
              className="dbg-btn"
              onClick={handleStart}
              disabled={recordType === 'untilEvent' && !selectedEvent}
            >▶ Record</button>
        }
        <button className="dbg-btn" onClick={handleClear}>Clear</button>
      </div>
      <div className="dbg-subheader">Export</div>
      <div className="dbg-control">
        <label className="dbg-control-label">Format</label>
        <select
          className="dbg-select"
          value={exportFormat}
          onChange={e => setExportFormat(e.target.value as ExportFormat)}
        >
          <option value="json">JSON</option>
          <option value="html">HTML</option>
        </select>
        <button className="dbg-btn" onClick={handleExport} disabled={entries.length === 0}>Export</button>
      </div>
      <div className="dbg-subheader">Trace ({filtered.length} entries){recording && recordType === 'nextNFrames' ? ` (${currentFrameCount} / ${frameLimit})` : ''}</div>
      <div className="dbg-trace-list">
        {filtered.slice(-200).reverse().map((e, i) => (
          <div key={i} className={`dbg-trace-entry dbg-trace-${e.level.toLowerCase()}`}>
            <span className="dbg-trace-level">{e.level}</span>
            <span className="dbg-trace-ns">{e.namespace}</span>
            <span className="dbg-trace-msg">{e.msg}</span>
            {e.data && (
              <span className="dbg-trace-data" title={JSON.stringify(e.data)}>
                {JSON.stringify(e.data).slice(0, 40)}...
              </span>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="dbg-empty">No entries</div>}
      </div>
    </>
  )
}
