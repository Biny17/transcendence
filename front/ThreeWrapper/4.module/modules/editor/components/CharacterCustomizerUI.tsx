"use client"
import { useState, useEffect, useRef } from "react"
import type { AccessoryConfig } from "../CharacterCustomizerModule"
type PaintState = { active: boolean; color: string; brushSize: number }
type Tab = "paint" | "accessories" | "animations"
type ActiveEdit = {
  id: string
  isNew: boolean
  originalConfig: AccessoryConfig
  gltfFileName: string
}
type Props = {
  onMount: (api: CharacterCustomizerApi) => void
  onPaintStateChange: (state: PaintState) => void
  onFillColor: (color: string) => void
  onClearPaint: () => void
  onAddAccessory: (config: AccessoryConfig, gltfFile?: File) => void
  onUpdateAccessory: (config: AccessoryConfig, gltfFile?: File) => void
  onRemoveAccessory: (id: string) => void
  onPlayAnimation: (name: string) => void
  onStopAnimation: () => void
  onExport: () => void
  onDownloadTexture: () => void
}
export type CharacterCustomizerApi = {
  setBones: (bones: string[]) => void
  setAnimations: (animations: string[]) => void
  setLoaded: (loaded: boolean) => void
}
const DEFAULT_ACC: Omit<AccessoryConfig, "id"> = {
  name: "New Accessory",
  boneName: "",
  meshKind: "box",
  size: { x: 0.5, y: 0.5, z: 0.5 },
  color: "#ff4444",
  offset: { x: 0, y: 0.3, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
}
function AccessoryForm({
  bones,
  value,
  gltfFileName,
  onChange,
  onGltfPick,
  onSave,
  onCancel
}: {
  bones: string[]
  value: AccessoryConfig
  gltfFileName: string
  onChange: (config: AccessoryConfig) => void
  onGltfPick: (file: File) => void
  onSave: () => void
  onCancel: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<AccessoryConfig>) => onChange({ ...value, ...patch })
  const setVec = (key: "size" | "offset" | "rotation" | "scale", axis: "x" | "y" | "z", raw: string) => {
    const n = parseFloat(raw)
    if (!isNaN(n)) onChange({ ...value, [key]: { ...value[key], [axis]: n } })
  }
  const numInput = (
    axis: string,
    val: number,
    onChange: (raw: string) => void,
    step = 0.05
  ) => (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 2 }}>
      <span style={{ width: 12, color: "#888", fontSize: 10 }}>{axis}</span>
      <input
        type="number"
        defaultValue={val}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
  return (
    <div style={panelCard}>
      <div style={row}>
        <span style={fieldLabel}>Name</span>
        <input
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      <div style={row}>
        <span style={fieldLabel}>Bone</span>
        <select
          value={value.boneName}
          onChange={(e) => set({ boneName: e.target.value })}
          style={{ ...inputStyle, flex: 1 }}
        >
          <option value="">Scene Root</option>
          {bones.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div style={row}>
        <span style={fieldLabel}>Shape</span>
        <select
          value={value.meshKind}
          onChange={(e) => set({ meshKind: e.target.value as AccessoryConfig["meshKind"] })}
          style={{ ...inputStyle, flex: 1 }}
        >
          <option value="box">Box</option>
          <option value="sphere">Sphere</option>
          <option value="cylinder">Cylinder</option>
          <option value="gltf">GLTF / GLB</option>
        </select>
      </div>
      {value.meshKind === "gltf" ? (
        <div style={{ marginBottom: 4 }}>
          <input ref={fileRef} type="file" accept=".gltf,.glb" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onGltfPick(f) }} />
          <button onClick={() => fileRef.current?.click()} style={btnSecondary}>
            {gltfFileName || "Pick GLTF / GLB…"}
          </button>
        </div>
      ) : (
        <div style={row}>
          <span style={fieldLabel}>Color</span>
          <input type="color" value={value.color}
            onChange={(e) => set({ color: e.target.value })}
            style={{ width: 40, height: 24, border: "none", background: "none", cursor: "pointer" }} />
        </div>
      )}
      {value.meshKind !== "gltf" && (
        <>
          <span style={{ ...fieldLabel, marginTop: 4, display: "block" }}>Size</span>
          {numInput("X", value.size.x, (v) => setVec("size", "x", v))}
          {numInput("Y", value.size.y, (v) => setVec("size", "y", v))}
          {numInput("Z", value.size.z, (v) => setVec("size", "z", v))}
        </>
      )}
      <span style={{ ...fieldLabel, marginTop: 4, display: "block" }}>Offset</span>
      {numInput("X", value.offset.x, (v) => setVec("offset", "x", v))}
      {numInput("Y", value.offset.y, (v) => setVec("offset", "y", v))}
      {numInput("Z", value.offset.z, (v) => setVec("offset", "z", v))}
      <span style={{ ...fieldLabel, marginTop: 4, display: "block" }}>Rotation °</span>
      {numInput("X", value.rotation.x, (v) => setVec("rotation", "x", v), 1)}
      {numInput("Y", value.rotation.y, (v) => setVec("rotation", "y", v), 1)}
      {numInput("Z", value.rotation.z, (v) => setVec("rotation", "z", v), 1)}
      <span style={{ ...fieldLabel, marginTop: 4, display: "block" }}>Scale</span>
      {numInput("X", value.scale.x, (v) => setVec("scale", "x", v))}
      {numInput("Y", value.scale.y, (v) => setVec("scale", "y", v))}
      {numInput("Z", value.scale.z, (v) => setVec("scale", "z", v))}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={onSave} style={btnPrimary}>Done</button>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}
let _idCounter = 1
export function CharacterCustomizerUI({
  onMount, onPaintStateChange, onFillColor, onClearPaint,
  onAddAccessory, onUpdateAccessory, onRemoveAccessory,
  onPlayAnimation, onStopAnimation, onExport, onDownloadTexture
}: Props) {
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<Tab>("paint")
  const [bones, setBones] = useState<string[]>([])
  const [animations, setAnimations] = useState<string[]>([])
  const [currentAnim, setCurrentAnim] = useState<string | null>(null)
  const [paintActive, setPaintActive] = useState(false)
  const [brushColor, setBrushColor] = useState("#3a7bd5")
  const [brushSize, setBrushSize] = useState(0.3)
  const [eraseMode, setEraseMode] = useState(false)
  const [fillColor, setFillColor] = useState("#e8c97a")
  const [accessories, setAccessories] = useState<AccessoryConfig[]>([])
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null)
  const apiRef = useRef<CharacterCustomizerApi>({ setBones, setAnimations, setLoaded })
  useEffect(() => { apiRef.current = { setBones, setAnimations, setLoaded } })
  useEffect(() => { onMount(apiRef.current) }, []) 
  useEffect(() => {
    onPaintStateChange({ active: paintActive, color: eraseMode ? "#ffffff" : brushColor, brushSize })
  }, [paintActive, brushColor, brushSize, eraseMode]) 
  const togglePaint = () => { setPaintActive((v) => !v); setEraseMode(false) }
  const defaultBone = bones.find((b) => b.toLowerCase().includes("head")) ?? bones[0] ?? ""
  const startAddNew = () => {
    const id = `acc_${_idCounter++}`
    const cfg: AccessoryConfig = { ...DEFAULT_ACC, id, boneName: defaultBone }
    setAccessories((prev) => [...prev, cfg])
    onAddAccessory(cfg)
    setActiveEdit({ id, isNew: true, originalConfig: cfg, gltfFileName: "" })
  }
  const startEdit = (acc: AccessoryConfig) => {
    setActiveEdit({ id: acc.id, isNew: false, originalConfig: { ...acc }, gltfFileName: acc.gltfUrl ? "Loaded" : "" })
  }
  const handleLiveChange = (updated: AccessoryConfig) => {
    setAccessories((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    onUpdateAccessory(updated)
  }
  const handleGltfPick = (file: File) => {
    if (!activeEdit) return
    const current = accessories.find((a) => a.id === activeEdit.id)
    if (!current) return
    setActiveEdit((ae) => ae ? { ...ae, gltfFileName: file.name } : ae)
    onAddAccessory({ ...current }, file) 
  }
  const handleSave = () => setActiveEdit(null)
  const handleCancel = () => {
    if (!activeEdit) return
    if (activeEdit.isNew) {
      setAccessories((prev) => prev.filter((a) => a.id !== activeEdit.id))
      onRemoveAccessory(activeEdit.id)
    } else {
      setAccessories((prev) => prev.map((a) => (a.id === activeEdit.id ? activeEdit.originalConfig : a)))
      onUpdateAccessory(activeEdit.originalConfig)
    }
    setActiveEdit(null)
  }
  const handleRemove = (id: string) => {
    if (activeEdit?.id === id) setActiveEdit(null)
    setAccessories((prev) => prev.filter((a) => a.id !== id))
    onRemoveAccessory(id)
  }
  const handlePlayAnim = (name: string) => {
    if (currentAnim === name) { onStopAnimation(); setCurrentAnim(null) }
    else { onPlayAnimation(name); setCurrentAnim(name) }
  }
  if (!loaded) {
    return (
      <div style={overlay}>
        <div style={panel}>
          <div style={{ color: "#aaa", textAlign: "center", padding: 20 }}>Loading character…</div>
        </div>
      </div>
    )
  }
  const editingConfig = activeEdit ? accessories.find((a) => a.id === activeEdit.id) : undefined
  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={panelHeader}>Character Customizer</div>
        <div style={tabBar}>
          {(["paint", "accessories", "animations"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={tab === t ? tabActive : tabInactive}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {}
        {tab === "paint" && (
          <div style={tabContent}>
            <button onClick={togglePaint}
              style={paintActive ? { ...btnPrimary, background: "#b03030" } : btnPrimary}>
              {paintActive ? "Exit Paint Mode" : "Enter Paint Mode"}
            </button>
            {paintActive && <div style={{ color: "#8af", fontSize: 11 }}>Click / drag on character to paint</div>}
            <div style={section}>
              <div style={row}>
                <span style={fieldLabel}>Color</span>
                <input type="color" value={brushColor}
                  onChange={(e) => { setBrushColor(e.target.value); setEraseMode(false) }}
                  style={colorPicker} />
                <button onClick={() => setEraseMode((v) => !v)}
                  style={eraseMode ? { ...btnSecondary, borderColor: "#f88", color: "#f88" } : btnSecondary}>
                  {eraseMode ? "Eraser ON" : "Eraser"}
                </button>
              </div>
              <div style={row}>
                <span style={fieldLabel}>Brush Size</span>
                <input type="range" min={0.05} max={1} step={0.01} value={brushSize}
                  onChange={(e) => setBrushSize(parseFloat(e.target.value))} style={{ flex: 1 }} />
                <span style={{ color: "#666", fontSize: 10 }}>{Math.round(brushSize * 100)}%</span>
              </div>
            </div>
            <div style={section}>
              <div style={row}>
                <span style={fieldLabel}>Fill Color</span>
                <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} style={colorPicker} />
                <button onClick={() => onFillColor(fillColor)} style={btnSecondary}>Fill All</button>
              </div>
              <button onClick={onClearPaint} style={btnSecondary}>Clear (white)</button>
              <button onClick={onDownloadTexture} style={btnSecondary}>Download Texture PNG</button>
            </div>
          </div>
        )}
        {}
        {tab === "accessories" && (
          <div style={tabContent}>
            {accessories.length === 0 && !activeEdit && (
              <div style={{ color: "#555", fontSize: 11 }}>No accessories yet.</div>
            )}
            {accessories.map((acc) => {
              const isEditing = activeEdit?.id === acc.id
              return (
                <div key={acc.id}>
                  <div style={accItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#ddd", fontSize: 12 }}>{acc.name}</span>
                      <span style={{ color: "#555", fontSize: 10, marginLeft: 6 }}>
                        ({acc.meshKind}){acc.boneName ? ` → ${acc.boneName}` : ""}
                      </span>
                    </div>
                    {acc.meshKind !== "gltf" && (
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: acc.color, marginRight: 6, flexShrink: 0 }} />
                    )}
                    <button
                      onClick={() => isEditing ? handleSave() : startEdit(acc)}
                      style={isEditing ? { ...btnTiny, borderColor: "#4a8af4", color: "#8af" } : btnTiny}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                    <button onClick={() => handleRemove(acc.id)}
                      style={{ ...btnTiny, marginLeft: 4, color: "#f88" }}>✕</button>
                  </div>
                  {isEditing && editingConfig && (
                    <AccessoryForm
                      key={activeEdit!.id}
                      bones={bones}
                      value={editingConfig}
                      gltfFileName={activeEdit?.gltfFileName ?? ""}
                      onChange={handleLiveChange}
                      onGltfPick={handleGltfPick}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  )}
                </div>
              )
            })}
            {!activeEdit && (
              <button onClick={startAddNew} style={{ ...btnPrimary, marginTop: 6 }}>
                + Add Accessory
              </button>
            )}
          </div>
        )}
        {}
        {tab === "animations" && (
          <div style={tabContent}>
            {currentAnim && <div style={{ color: "#8af", fontSize: 11 }}>▶ {currentAnim}</div>}
            <button onClick={() => { onStopAnimation(); setCurrentAnim(null) }} style={btnSecondary}>Stop</button>
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              {animations.map((anim) => (
                <button key={anim} onClick={() => handlePlayAnim(anim)}
                  style={currentAnim === anim ? animBtnActive : animBtnStyle}>
                  {anim}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ borderTop: "1px solid #2a2a3a", padding: "8px 12px" }}>
          <button onClick={onExport} style={btnPrimary}>Export Config JSON</button>
        </div>
      </div>
    </div>
  )
}
const overlay: React.CSSProperties = {
  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
  pointerEvents: "none", display: "flex", alignItems: "flex-start"
}
const panel: React.CSSProperties = {
  pointerEvents: "auto", background: "rgba(14,14,22,0.93)",
  borderRight: "1px solid #2a2a3a", width: 270, height: "100%",
  display: "flex", flexDirection: "column", fontFamily: "monospace",
  fontSize: 12, overflowY: "auto"
}
const panelHeader: React.CSSProperties = {
  padding: "10px 12px", color: "#fff", fontWeight: "bold", fontSize: 13,
  borderBottom: "1px solid #2a2a3a", background: "rgba(255,255,255,0.03)"
}
const tabBar: React.CSSProperties = { display: "flex", borderBottom: "1px solid #2a2a3a" }
const tabInactive: React.CSSProperties = {
  flex: 1, padding: "6px 0", background: "none",
  borderTop: "none", borderLeft: "none", borderRight: "none",
  borderBottom: "2px solid transparent",
  color: "#666", cursor: "pointer", fontSize: 11, fontFamily: "monospace"
}
const tabActive: React.CSSProperties = {
  ...tabInactive, borderBottom: "2px solid #4a8af4", color: "#fff"
}
const tabContent: React.CSSProperties = {
  padding: "10px 12px", display: "flex", flexDirection: "column",
  gap: 4, flex: 1, overflowY: "auto"
}
const section: React.CSSProperties = {
  marginTop: 8, borderTop: "1px solid #2a2a3a", paddingTop: 8,
  display: "flex", flexDirection: "column", gap: 4
}
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6 }
const fieldLabel: React.CSSProperties = { color: "#888", fontSize: 11, minWidth: 68 }
const inputStyle: React.CSSProperties = {
  background: "#1a1a2a", border: "1px solid #333", color: "#ddd",
  padding: "2px 4px", fontSize: 11, fontFamily: "monospace", width: 60, borderRadius: 2
}
const colorPicker: React.CSSProperties = {
  width: 40, height: 24, border: "none", background: "none", cursor: "pointer"
}
const btnPrimary: React.CSSProperties = {
  background: "#1a4a9a", border: "1px solid #2a6aee", color: "#ddf",
  padding: "5px 10px", cursor: "pointer", fontSize: 11,
  fontFamily: "monospace", borderRadius: 3, width: "100%"
}
const btnSecondary: React.CSSProperties = {
  background: "#1a1a2a", border: "1px solid #333", color: "#aaa",
  padding: "4px 8px", cursor: "pointer", fontSize: 11,
  fontFamily: "monospace", borderRadius: 3
}
const btnTiny: React.CSSProperties = {
  background: "none", border: "1px solid #333", color: "#aaa",
  padding: "2px 6px", cursor: "pointer", fontSize: 10,
  fontFamily: "monospace", borderRadius: 2
}
const panelCard: React.CSSProperties = {
  background: "#0a0a16", border: "1px solid #2a2a3a", borderRadius: 4,
  padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2,
  marginTop: 2
}
const accItem: React.CSSProperties = {
  display: "flex", alignItems: "center", background: "#111120",
  border: "1px solid #2a2a3a", borderRadius: 3, padding: "4px 6px"
}
const animBtnStyle: React.CSSProperties = {
  background: "#111120", border: "1px solid #2a2a3a", color: "#aaa",
  padding: "4px 8px", cursor: "pointer", fontSize: 10,
  fontFamily: "monospace", borderRadius: 2, textAlign: "left"
}
const animBtnActive: React.CSSProperties = {
  ...animBtnStyle, background: "#0e2a5a", borderColor: "#2a6aee", color: "#8af"
}
