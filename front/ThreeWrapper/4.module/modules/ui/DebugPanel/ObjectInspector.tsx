'use client'
import { useState, useEffect, useCallback } from 'react'
import type { HitboxShape } from '@/ThreeWrapper/2.world/tools/ObjectManager'


interface Vec3 {
  x: number
  y: number
  z: number
}

interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

interface HitboxShapeDef {
  kind?: string
  halfExtents?: Vec3
  radius?: number
  height?: number
}

interface PieceHitbox {
  shape: HitboxShapeDef
  relativeOffset?: Vec3
  collidesWith?: string
  isSensor?: boolean
  tag?: string
}

interface PieceAsset {
  uuid?: string
  type?: string
  name?: string
  visible?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  position?: Vec3
  rotation?: Quaternion
  scale?: Vec3
  userData?: Record<string, unknown>
}

interface Piece {
  asset: PieceAsset
  relativePosition: Vec3
  hitboxes: PieceHitbox[]
}

interface ManagedObject {
  id: string
  name?: string
  type: string
  componentId: string
  position: Vec3
  rotation: Quaternion
  velocity?: Vec3
  isGrounded?: boolean
  extraData: Record<string, unknown>
  pieces: Piece[]
}

interface ObjectInspectorProps {
  selectedId?: string | null
  onDeselect?: () => void
  showHoverOverlay?: boolean
}

function vec3ToString(v: Vec3): string {
  return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`
}

export function ObjectInspector({ selectedId, onDeselect, showHoverOverlay = false }: ObjectInspectorProps) {
  const [hovered, setHovered] = useState<ManagedObject | null>(null)
  const [pinned, setPinned] = useState<ManagedObject | null>(null)
  const [editingPos, setEditingPos] = useState<Vec3>({ x: 0, y: 0, z: 0 })
  const [editingRot, setEditingRot] = useState<Quaternion>({ x: 0, y: 0, z: 0, w: 1 })
  const [editingVel, setEditingVel] = useState<Vec3>({ x: 0, y: 0, z: 0 })
  const [extraPairs, setExtraPairs] = useState<Array<[string, string]>>([])
  const [hoverMouse, setHoverMouse] = useState({ x: 0, y: 0, distance: 0 })
  const [expandedPieces, setExpandedPieces] = useState<Set<number>>(new Set())
  const [expandedHitboxes, setExpandedHitboxes] = useState<Set<string>>(new Set())
  const [editingPieceRelPos, setEditingPieceRelPos] = useState<Record<number, Vec3>>({})
  const [editingHitbox, setEditingHitbox] = useState<Record<string, { shape: string; relativeOffset: Vec3; collidesWith: string; isSensor: boolean; tag: string; relativeOffsetSet: boolean }>>({})

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ object: ManagedObject | null; mouseX?: number; mouseY?: number; distance?: number }>
      setHovered(ce.detail?.object ?? null)
      if (ce.detail?.object) {
        setHoverMouse({
          x: ce.detail.mouseX ?? 0,
          y: ce.detail.mouseY ?? 0,
          distance: ce.detail.distance ?? 0,
        })
      }
    }
    window.addEventListener('debug:hover', handler)
    return () => window.removeEventListener('debug:hover', handler)
  }, [])

  useEffect(() => {
    if (selectedId) {
      const obj = window.__debugCtrl?.getObjectById(selectedId) as ManagedObject | null
      if (obj) {
        setPinned(obj)
        setEditingPos({ ...obj.position })
        setEditingRot({ ...obj.rotation })
        if (obj.velocity) setEditingVel({ ...obj.velocity })
        setExtraPairs(Object.entries(obj.extraData).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]))
      } else {
        setPinned(null)
      }
    } else {
      setPinned(null)
    }
  }, [selectedId])

  const handlePin = useCallback((obj: ManagedObject) => {
    setPinned(obj)
    setEditingPos({ ...obj.position })
    setEditingRot({ ...obj.rotation })
    if (obj.velocity) setEditingVel({ ...obj.velocity })
    setExtraPairs(Object.entries(obj.extraData).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]))
  }, [])

  const handleClear = useCallback(() => {
    setPinned(null)
    setEditingPos({ x: 0, y: 0, z: 0 })
    setEditingRot({ x: 0, y: 0, z: 0, w: 1 })
    setEditingVel({ x: 0, y: 0, z: 0 })
    setExtraPairs([])
    onDeselect?.()
  }, [onDeselect])

  const applyPosition = useCallback(() => {
    if (!pinned) return
    window.__debugCtrl?.setObjectPosition(pinned.id, editingPos)
  }, [pinned, editingPos])

  const applyRotation = useCallback(() => {
    if (!pinned) return
    window.__debugCtrl?.setObjectRotation(pinned.id, editingRot)
  }, [pinned, editingRot])

  const applyVelocity = useCallback(() => {
    if (!pinned) return
    window.__debugCtrl?.setObjectVelocity(pinned.id, editingVel)
  }, [pinned, editingVel])

  const applyExtra = useCallback(() => {
    if (!pinned) return
    for (const [key, valStr] of extraPairs) {
      let value: unknown = valStr
      try { value = JSON.parse(valStr) } catch { /* raw string */ }
      window.__debugCtrl?.setObjectExtra(pinned.id, key, value)
    }
  }, [pinned, extraPairs])

  const applyPieceRelPos = useCallback((pieceIdx: number) => {
    if (!pinned) return
    const relPos = editingPieceRelPos[pieceIdx]
    if (relPos) window.__debugCtrl?.setPieceRelativePosition(pinned.id, pieceIdx, relPos)
  }, [pinned, editingPieceRelPos])

  const applyHitbox = useCallback((pieceIdx: number, hitboxIdx: number) => {
    if (!pinned) return
    const key = `${pieceIdx}-${hitboxIdx}`
    const hb = editingHitbox[key]
    if (hb) {
      let shape: HitboxShape = { kind: 'auto' }
      try { shape = JSON.parse(hb.shape) } catch { shape = { kind: hb.shape } as HitboxShape }
      const collidesWith = hb.collidesWith ? hb.collidesWith.split(',').map(s => s.trim()).filter(Boolean) : undefined
      window.__debugCtrl?.setPieceHitbox(pinned.id, pieceIdx, hitboxIdx, {
        shape,
        relativeOffset: hb.relativeOffset,
        collidesWith,
        isSensor: hb.isSensor,
        tag: hb.tag,
      })
    }
  }, [pinned, editingHitbox])

  const handleAddExtra = () => {
    setExtraPairs(prev => [...prev, ['', '']])
  }

  const handleRemoveExtra = (idx: number) => {
    setExtraPairs(prev => prev.filter((_, i) => i !== idx))
  }

  const handleExtraPairChange = (idx: number, field: 0 | 1, value: string) => {
    setExtraPairs(prev => prev.map((pair, i) => i === idx ? (field === 0 ? [value, pair[1]] : [pair[0], value]) : pair))
  }

  const handleTeleportToObject = () => {
    if (!pinned) return
    window.__debugCtrl?.teleportToObject(pinned.id)
  }

  const handleTeleportObjectToPlayer = () => {
    if (!pinned) return
    window.__debugCtrl?.teleportObjectToPlayer(pinned.id)
  }

  const handleClone = () => {
    if (!pinned) return
    window.__debugCtrl?.cloneObject(pinned.id)
  }

  const handleDelete = () => {
    if (!pinned) return
    window.__debugCtrl?.removeObject(pinned.id)
    handleClear()
  }

  const handleFreeze = () => {
    if (!pinned) return
    window.__debugCtrl?.freezeObject(pinned.id, true)
  }

  const handleUnfreeze = () => {
    if (!pinned) return
    window.__debugCtrl?.freezeObject(pinned.id, false)
  }

  const handleAddPiece = () => {
    if (!pinned) return
    window.__debugCtrl?.addPiece(pinned.id, {
      relativePosition: { x: 0, y: 0, z: 0 },
      hitboxes: [],
    })
  }

  const handleRemovePiece = (pieceIndex: number) => {
    if (!pinned) return
    window.__debugCtrl?.removePiece(pinned.id, pieceIndex)
  }

  const displayObj = pinned ?? hovered

  return (
    <div className="object-inspector">
      <div className="object-inspector-body">
          {!displayObj ? (
            <div className="object-inspector-empty">
              {hovered
                ? `Hover: ${hovered.name ?? hovered.id} (${hovered.type})\nClick "Pin" to lock inspection`
                : 'Hover over an object to inspect it'}
            </div>
          ) : (
            <>
              <div className="object-inspector-section">
                <div className="object-inspector-section-title">Identity</div>
                <div className="object-inspector-row"><span className="oi-label">ID</span><span className="oi-value">{displayObj.id}</span></div>
                <div className="object-inspector-row"><span className="oi-label">Name</span><span className="oi-value">{displayObj.name ?? '(none)'}</span></div>
                <div className="object-inspector-row"><span className="oi-label">Type</span><span className="oi-value">{displayObj.type}</span></div>
                <div className="object-inspector-row"><span className="oi-label">Component</span><span className="oi-value">{displayObj.componentId}</span></div>
              </div>

              <div className="object-inspector-section">
                <div className="object-inspector-section-title">Transform</div>
                <div className="object-inspector-row">
                  <span className="oi-label">Position</span>
                  <span className="oi-inputs">
                    <input type="number" className="oi-num" value={editingPos.x} step={0.1} onChange={e => setEditingPos(p => ({ ...p, x: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingPos.y} step={0.1} onChange={e => setEditingPos(p => ({ ...p, y: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingPos.z} step={0.1} onChange={e => setEditingPos(p => ({ ...p, z: parseFloat(e.target.value) }))} />
                    <button className="oi-apply" onClick={applyPosition}>Apply</button>
                  </span>
                </div>
                <div className="object-inspector-row">
                  <span className="oi-label">Rotation</span>
                  <span className="oi-inputs">
                    <input type="number" className="oi-num" value={editingRot.x} step={0.01} onChange={e => setEditingRot(r => ({ ...r, x: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingRot.y} step={0.01} onChange={e => setEditingRot(r => ({ ...r, y: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingRot.z} step={0.01} onChange={e => setEditingRot(r => ({ ...r, z: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingRot.w} step={0.01} onChange={e => setEditingRot(r => ({ ...r, w: parseFloat(e.target.value) }))} />
                    <button className="oi-apply" onClick={applyRotation}>Apply</button>
                  </span>
                </div>
                <div className="object-inspector-row">
                  <span className="oi-label">Velocity</span>
                  <span className="oi-inputs">
                    <input type="number" className="oi-num" value={editingVel.x} step={0.1} onChange={e => setEditingVel(v => ({ ...v, x: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingVel.y} step={0.1} onChange={e => setEditingVel(v => ({ ...v, y: parseFloat(e.target.value) }))} />
                    <input type="number" className="oi-num" value={editingVel.z} step={0.1} onChange={e => setEditingVel(v => ({ ...v, z: parseFloat(e.target.value) }))} />
                    <button className="oi-apply" onClick={applyVelocity}>Apply</button>
                  </span>
                </div>
                <div className="object-inspector-row">
                  <span className="oi-label">Grounded</span>
                  <span className="oi-value">{displayObj.isGrounded ? 'Yes' : 'No'}</span>
                </div>
              </div>

               <div className="object-inspector-section">
                 <div className="object-inspector-section-title">Actions</div>
                 <div className="oi-actions">
                   <button className="oi-action-btn" onClick={handleTeleportToObject}>Teleport to Object</button>
                   <button className="oi-action-btn" onClick={handleTeleportObjectToPlayer}>Teleport to Player</button>
                   <button className="oi-action-btn" onClick={handleClone}>Clone</button>
                   <button className="oi-action-btn" onClick={handleDelete}>Delete</button>
                   <button className="oi-action-btn" onClick={handleFreeze}>Freeze</button>
                   <button className="oi-action-btn" onClick={handleUnfreeze}>Unfreeze</button>
                 </div>
               </div>



              <div className="object-inspector-section">
                <div className="object-inspector-section-title">
                  Extra Data
                  <button className="oi-add-btn" onClick={handleAddExtra}>+</button>
                </div>
                {extraPairs.length === 0 && <div className="oi-empty">No extra data</div>}
                {extraPairs.map(([key, val], idx) => (
                  <div key={idx} className="object-inspector-row">
                    <input type="text" className="oi-key" placeholder="key" value={key} onChange={e => handleExtraPairChange(idx, 0, e.target.value)} />
                    <input type="text" className="oi-val" placeholder="value" value={val} onChange={e => handleExtraPairChange(idx, 1, e.target.value)} />
                    <button className="oi-remove" onClick={() => handleRemoveExtra(idx)}>x</button>
                  </div>
                ))}
                {extraPairs.length > 0 && (
                  <button className="oi-apply oi-full" onClick={applyExtra}>Apply Extra</button>
                )}
              </div>

               <div className="object-inspector-section">
                 <div className="object-inspector-section-title">
                   Pieces ({displayObj.pieces.length})
                   {pinned && <button className="oi-add-btn" onClick={handleAddPiece}>+</button>}
                 </div>
                 {displayObj.pieces.length === 0 && <div className="oi-empty">No pieces</div>}
                 {displayObj.pieces.map((piece, idx) => {
                   const asset = piece?.asset
                   const hitboxes = piece?.hitboxes || []
                   const pieceKey = `piece-${idx}`
                   const isExpanded = expandedPieces.has(idx)
                   return (
                     <div key={idx} className="oi-piece">
                       <div className="oi-piece-header" onClick={() => {
                         setExpandedPieces(prev => {
                           const next = new Set(prev)
                           if (next.has(idx)) next.delete(idx)
                           else next.add(idx)
                           return next
                         })
                       }} style={{ cursor: 'pointer' }}>
                         <span className="oi-expand">{isExpanded ? '▼' : '▶'}</span>
                         <span className="oi-label">Piece {idx}</span>
                         <span className="oi-value">{asset?.name ?? asset?.type ?? 'unknown'}</span>
                         {pinned && <button className="oi-remove" onClick={(e) => { e.stopPropagation(); handleRemovePiece(idx) }}>x</button>}
                       </div>
                       {isExpanded && (
                         <div className="oi-piece-details">
                           <div className="oi-subsection">
                             <div className="oi-subsection-title">Asset</div>
                             <div className="object-inspector-row">
                               <span className="oi-label">UUID</span>
                               <span className="oi-value">{asset?.uuid ?? '(none)'}</span>
                             </div>
                             <div className="object-inspector-row">
                               <span className="oi-label">Type</span>
                               <span className="oi-value">{asset?.type ?? '(none)'}</span>
                             </div>
                             <div className="object-inspector-row">
                               <span className="oi-label">Name</span>
                               <span className="oi-value">{asset?.name ?? '(none)'}</span>
                             </div>
                             <div className="object-inspector-row">
                               <span className="oi-label">Visible</span>
                               <span className="oi-value">{asset?.visible !== undefined ? (asset.visible ? 'Yes' : 'No') : '(none)'}</span>
                             </div>
                             <div className="object-inspector-row">
                               <span className="oi-label">CastShadow</span>
                               <span className="oi-value">{asset?.castShadow !== undefined ? (asset.castShadow ? 'Yes' : 'No') : '(none)'}</span>
                             </div>
                             <div className="object-inspector-row">
                               <span className="oi-label">ReceiveShadow</span>
                               <span className="oi-value">{asset?.receiveShadow !== undefined ? (asset.receiveShadow ? 'Yes' : 'No') : '(none)'}</span>
                             </div>
                             {asset?.position && (
                               <div className="object-inspector-row">
                                 <span className="oi-label">Position</span>
                                 <span className="oi-value">{vec3ToString(asset.position)}</span>
                               </div>
                             )}
                             {asset?.rotation && (
                               <div className="object-inspector-row">
                                 <span className="oi-label">Rotation</span>
                                 <span className="oi-value">{vec3ToString(asset.rotation as unknown as Vec3)}</span>
                               </div>
                             )}
                             {asset?.scale && (
                               <div className="object-inspector-row">
                                 <span className="oi-label">Scale</span>
                                 <span className="oi-value">{vec3ToString(asset.scale)}</span>
                               </div>
                             )}
                             {asset?.userData && Object.keys(asset.userData).length > 0 && (
                               <div className="object-inspector-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                 <span className="oi-label">UserData</span>
                                 <div className="oi-userdata">
                                   {Object.entries(asset.userData).map(([k, v]) => (
                                     <div key={k} className="object-inspector-row">
                                       <span className="oi-label-sm">{k}</span>
                                       <span className="oi-value">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                            <div className="object-inspector-row">
                              <span className="oi-label">Relative Pos</span>
                              <span className="oi-inputs">
                                {(() => {
                                  const initRelPos = editingPieceRelPos[idx] ?? piece.relativePosition
                                  return (
                                    <>
                                      <input type="number" className="oi-num" value={initRelPos.x} step={0.1} onChange={e => setEditingPieceRelPos(prev => ({ ...prev, [idx]: { ...(prev[idx] ?? piece.relativePosition), x: parseFloat(e.target.value) } }))} />
                                      <input type="number" className="oi-num" value={initRelPos.y} step={0.1} onChange={e => setEditingPieceRelPos(prev => ({ ...prev, [idx]: { ...(prev[idx] ?? piece.relativePosition), y: parseFloat(e.target.value) } }))} />
                                      <input type="number" className="oi-num" value={initRelPos.z} step={0.1} onChange={e => setEditingPieceRelPos(prev => ({ ...prev, [idx]: { ...(prev[idx] ?? piece.relativePosition), z: parseFloat(e.target.value) } }))} />
                                      <button className="oi-apply" onClick={() => applyPieceRelPos(idx)}>Apply</button>
                                    </>
                                  )
                                })()}
                              </span>
                            </div>
                           <div className="oi-subsection">
                             <div className="oi-subsection-title">Hitboxes ({hitboxes.length})</div>
                             {hitboxes.length === 0 && <div className="oi-empty">No hitboxes</div>}
                             {hitboxes.map((hb: PieceHitbox, hidx: number) => {
                               const hbKey = `piece-${idx}-hitbox-${hidx}`
                               const hbExpanded = expandedHitboxes.has(hbKey)
                               const shapeVal = hb.shape?.kind ?? (typeof hb.shape === 'string' ? hb.shape : JSON.stringify(hb.shape))
                               return (
                                 <div key={hidx} className="oi-hitbox">
                                   <div className="oi-hitbox-header" onClick={() => {
                                     setExpandedHitboxes(prev => {
                                       const next = new Set(prev)
                                       if (next.has(hbKey)) next.delete(hbKey)
                                       else next.add(hbKey)
                                       return next
                                     })
                                   }} style={{ cursor: 'pointer' }}>
                                     <span className="oi-expand">{hbExpanded ? '▼' : '▶'}</span>
                                     <span className="oi-label">Hitbox {hidx}</span>
                                     <span className="oi-value">{shapeVal}</span>
                                   </div>
                                    {hbExpanded && (
                                      <div className="oi-hitbox-details">
                                        <div className="object-inspector-row">
                                          <span className="oi-label">Shape</span>
                                          <input type="text" className="oi-val" value={typeof hb.shape === 'string' ? hb.shape : JSON.stringify(hb.shape)} onChange={e => {
                                            const key = `${idx}-${hidx}`
                                            setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), shape: e.target.value } }))
                                          }} />
                                        </div>
                                        {hb.relativeOffset && (
                                          <div className="object-inspector-row">
                                            <span className="oi-label">Offset</span>
                                            <span className="oi-inputs">
                                              {(() => {
                                                const key = `${idx}-${hidx}`
                                                const initOff = editingHitbox[key]?.relativeOffset ?? hb.relativeOffset!
                                                return (
                                                  <>
                                                    <input type="number" className="oi-num" value={initOff.x} step={0.1} onChange={e => setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), relativeOffset: { ...initOff, x: parseFloat(e.target.value) } } }))} />
                                                    <input type="number" className="oi-num" value={initOff.y} step={0.1} onChange={e => setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), relativeOffset: { ...initOff, y: parseFloat(e.target.value) } } }))} />
                                                    <input type="number" className="oi-num" value={initOff.z} step={0.1} onChange={e => setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), relativeOffset: { ...initOff, z: parseFloat(e.target.value) } } }))} />
                                                  </>
                                                )
                                              })()}
                                            </span>
                                          </div>
                                        )}
                                        <div className="object-inspector-row">
                                          <span className="oi-label">CollidesWith</span>
                                          <input type="text" className="oi-val" value={(() => { const key = `${idx}-${hidx}`; return editingHitbox[key]?.collidesWith ?? hb.collidesWith ?? '' })()} onChange={e => {
                                            const key = `${idx}-${hidx}`
                                            setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), collidesWith: e.target.value } }))
                                          }} />
                                        </div>
                                        <div className="object-inspector-row">
                                          <span className="oi-label">IsSensor</span>
                                          <input type="checkbox" className="dbg-checkbox" checked={(() => { const key = `${idx}-${hidx}`; return editingHitbox[key]?.isSensor ?? hb.isSensor ?? false })()} onChange={e => {
                                            const key = `${idx}-${hidx}`
                                            setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), isSensor: e.target.checked } }))
                                          }} />
                                        </div>
                                        <div className="object-inspector-row">
                                          <span className="oi-label">Tag</span>
                                          <input type="text" className="oi-val" value={(() => { const key = `${idx}-${hidx}`; return editingHitbox[key]?.tag ?? hb.tag ?? '' })()} onChange={e => {
                                            const key = `${idx}-${hidx}`
                                            setEditingHitbox(prev => ({ ...prev, [key]: { ...(prev[key] ?? { shape: '', relativeOffset: { x: 0, y: 0, z: 0 }, collidesWith: '', isSensor: false, tag: '' }), tag: e.target.value } }))
                                          }} />
                                        </div>
                                        <button className="oi-apply oi-full" onClick={() => applyHitbox(idx, hidx)}>Apply Hitbox</button>
                                      </div>
                                    )}
                                 </div>
                               )
                             })}
                           </div>
                         </div>
                       )}
                     </div>
                   )
                 })}
               </div>
            </>
          )}
        </div>

      {showHoverOverlay && hovered && hovered !== pinned && (
        <div
          className="hover-overlay"
          style={{
            left: Math.min(hoverMouse.x + 15, window.innerWidth - 180),
            top: Math.min(hoverMouse.y + 15, window.innerHeight - 120),
          }}
        >
          <div className="hover-overlay-title">{hovered.name ?? hovered.id}</div>
          <div className="hover-overlay-row"><span className="hol-label">Type</span><span className="hol-value">{hovered.type}</span></div>
          <div className="hover-overlay-row"><span className="hol-label">Dist</span><span className="hol-value">{hoverMouse.distance.toFixed(1)}m</span></div>
          <div className="hover-overlay-row"><span className="hol-label">Pos</span><span className="hol-value">{vec3ToString(hovered.position)}</span></div>
          {hovered.extraData && typeof hovered.extraData.life === 'number' && (
            <div className="hover-overlay-row"><span className="hol-label">Life</span><span className="hol-value">{hovered.extraData.life}</span></div>
          )}
          {hovered.extraData && typeof hovered.extraData.score === 'number' && (
            <div className="hover-overlay-row"><span className="hol-label">Score</span><span className="hol-value">{hovered.extraData.score}</span></div>
          )}
          {hovered.extraData && hovered.extraData.team != null && (
            <div className="hover-overlay-row"><span className="hol-label">Team</span><span className="hol-value">{String(hovered.extraData.team)}</span></div>
          )}
        </div>
      )}
    </div>
  )
}
