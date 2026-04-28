import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'
import type { ManagedObject, PhysicsDescriptor, PieceHitbox, HitboxShape, Vec3, Quat } from './ObjectManager'
export const COLLISION_LAYER: Record<string, number> = {
  player:    0x0001,
  npc:       0x0002,
  map:       0x0004,
  map_decor: 0x0008,
}
function getMembership(objectType: string): number {
  return COLLISION_LAYER[objectType] ?? COLLISION_LAYER.map
}
function buildInteractionGroups(membership: number, layerNames?: string[]): number {
  const filter =
    !layerNames || layerNames.length === 0
      ? 0xffff
      : layerNames.reduce((acc, name) => acc | (COLLISION_LAYER[name] ?? 0), 0)
  return ((filter & 0xffff) << 16) | (membership & 0xffff)
}
export type ZoneShape =
  | { kind: 'sphere'; radius: number }
  | { kind: 'box'; halfExtents: { x: number; y: number; z: number } }
  | { kind: 'cylinder'; radius: number; height: number }
export interface Zone {
  id: string
  center: { x: number; y: number; z: number }
  shape: ZoneShape
  onEnter?: (obj: ManagedObject) => void
  onExit?: (obj: ManagedObject) => void
}
export interface PhysicsWorldConfig {
  gravity?: { x: number; y: number; z: number }
  debug?: boolean
}
type SyncCallback = ((pos: Vec3, rot?: Quat) => void) | undefined
type PhysicsEntry = {
  body: RAPIER.RigidBody
  colliders: RAPIER.Collider[]
  sync: SyncCallback
  bottomOffset: number
  halfExtents: { x: number; y: number; z: number }
  relativeOffset: Vec3
}
export class PhysicsWorld {
  private world: RAPIER.World | null = null
  private scene: THREE.Scene
  private config: Required<PhysicsWorldConfig>
  private entries: Map<string, PhysicsEntry> = new Map()
  private zones: Map<string, { zone: Zone; inside: Set<string> }> = new Map()
  private debugMeshes: Map<string, THREE.Object3D> = new Map()
  private _stepping = false
  private _disposed = false
  constructor(scene: THREE.Scene, config: PhysicsWorldConfig = {}) {
    this.scene = scene
    this.config = {
      gravity: config.gravity ?? { x: 0, y: -9.81, z: 0 },
      debug: config.debug ?? false,
    }
  }
  async init(): Promise<void> {
    await RAPIER.init()
    this.world = new RAPIER.World(this.config.gravity)
  }
  setDebugEnabled(enabled: boolean): void {
    this.config.debug = enabled
    if (enabled) {
      for (const [pieceId, entry] of this.entries) {
        const existingKeys = new Set<string>()
        let i = 0
        while (this.debugMeshes.has(`${pieceId}_${i}`)) {
          existingKeys.add(`${pieceId}_${i}`)
          i++
        }
        if (existingKeys.size < entry.colliders.length) {
          this.createDebugMeshes(pieceId, entry.colliders.map((_, idx) => {
            const hb = this.findHitboxForCollider(pieceId, idx)
            return hb ?? { shape: { kind: 'box', halfExtents: entry.halfExtents }, relativeOffset: entry.relativeOffset }
          }), {} as PhysicsDescriptor)
          for (const key of existingKeys) {
            this.removeDebugMesh(key)
          }
        }
      }
    }
    for (const mesh of this.debugMeshes.values()) {
      mesh.visible = enabled
    }
  }
  private findHitboxForCollider(pieceId: string, _colliderIndex: number): PieceHitbox | undefined {
    return undefined
  }
  step(delta: number, allObjects: ManagedObject[]): void {
    if (this._disposed || this._stepping || !this.world) return
    this._stepping = true
    this.world.timestep = delta
    this.world.step()
    this._stepping = false
    for (const [pieceId, entry] of this.entries) {
      if (!entry.sync) continue
      const t = entry.body.translation()
      const r = entry.body.rotation()
      const pos = { x: t.x, y: t.y, z: t.z }
      const rot = { x: r.x, y: r.y, z: r.z, w: r.w }
      entry.sync(pos, rot)
      this.syncDebugMeshes(pieceId, pos, rot)
    }
    this.updateZones(allObjects)
  }
  registerPiece(
    pieceId: string,
    descriptor: PhysicsDescriptor,
    hitboxes: PieceHitbox[],
    sync: SyncCallback,
    objectType?: string,
  ): void {
    if (!this.world) {
      console.warn('[PhysicsWorld] registerPiece() called before init()')
      return
    }
    if (this.entries.has(pieceId)) return
    const gravityScale = descriptor.gravityScale ?? (descriptor.bodyType === 'static' ? 0 : 1)
    let bodyDesc: RAPIER.RigidBodyDesc
    if (descriptor.bodyType === 'static') {
      bodyDesc = RAPIER.RigidBodyDesc.fixed()
    } else if (descriptor.bodyType === 'kinematic') {
      bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    } else {
      bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    }
    bodyDesc.setGravityScale(gravityScale)
    if (descriptor.mass !== undefined && descriptor.bodyType === 'dynamic') {
      bodyDesc.setAdditionalMass(descriptor.mass)
    }
    const body = this.world.createRigidBody(bodyDesc)
    if (descriptor.lockRotations) {
      body.setEnabledRotations(false, false, false, true)
    }
    const colliders: RAPIER.Collider[] = []
    for (const hb of hitboxes) {
      const colliderDesc = this.buildColliderDesc(hb.shape)
      colliderDesc
        .setRestitution(descriptor.restitution ?? 0.3)
        .setFriction(descriptor.friction ?? 0.8)
        .setCollisionGroups(buildInteractionGroups(getMembership(objectType ?? 'map'), hb.collidesWith))
      if (hb.relativeOffset) {
        colliderDesc.setTranslation(hb.relativeOffset.x, hb.relativeOffset.y, hb.relativeOffset.z)
      }
      colliders.push(this.world.createCollider(colliderDesc, body))
    }
    const bottomOffset = this.computeBottomOffset(hitboxes[0]?.shape)
    const halfExtents = this.computeHalfExtents(hitboxes[0]?.shape)
    const relativeOffset = hitboxes[0]?.relativeOffset ?? { x: 0, y: 0, z: 0 }
    this.entries.set(pieceId, { body, colliders, sync, bottomOffset, halfExtents, relativeOffset })
    if (this.config.debug) {
      this.createDebugMeshes(pieceId, hitboxes, descriptor)
    }
  }
  unregister(id: string): void {
    if (!this.world) return
    for (const [pieceId, entry] of this.entries) {
      if (!pieceId.startsWith(id + '_') && pieceId !== id) continue
      for (const col of entry.colliders) {
        this.world!.removeCollider(col, false)
      }
      this.world!.removeRigidBody(entry.body)
      this.entries.delete(pieceId)
      this.removeDebugMeshesForId(pieceId)
    }
  }
  setVelocity(id: string, v: Vec3): void {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        try {
          entry.body.setLinvel(v, true)
        } catch (e) {
          console.warn('[PhysicsWorld] setVelocity failed for', pieceId, e)
        }
      }
    }
  }
  getVelocity(id: string): Vec3 {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        try {
          const v = entry.body.linvel()
          return { x: v.x, y: v.y, z: v.z }
        } catch (e) {
          console.warn('[PhysicsWorld] getVelocity failed for', pieceId, e)
        }
      }
    }
    return { x: 0, y: 0, z: 0 }
  }
  applyImpulse(id: string, impulse: Vec3): void {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        try {
          entry.body.applyImpulse(impulse, true)
        } catch (e) {
          console.warn('[PhysicsWorld] applyImpulse failed for', pieceId, e)
        }
      }
    }
  }
  setPosition(id: string, pos: Vec3): void {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        try {
          entry.body.setTranslation(pos, true)
        } catch (e) {
          console.warn('[PhysicsWorld] setPosition failed for', pieceId, e)
        }
      }
    }
  }
  setRotation(id: string, rot: Quat): void {
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        try {
          entry.body.setRotation(quat, true)
        } catch (e) {
          console.warn('[PhysicsWorld] setRotation failed for', pieceId, e)
        }
      }
    }
  }
  isGrounded(id: string, threshold = 0.15): boolean {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        if (!this.world) return false
        const pos = entry.body.translation()
        const bottomY = pos.y + entry.relativeOffset.y - entry.bottomOffset
        const hx = entry.halfExtents.x
        const hz = entry.halfExtents.z
        const rayLen = Math.max(threshold + 0.05, entry.bottomOffset + 0.1)
        const corners = [
          { x: pos.x - hx, z: pos.z - hz },
          { x: pos.x + hx, z: pos.z - hz },
          { x: pos.x - hx, z: pos.z + hz },
          { x: pos.x + hx, z: pos.z + hz },
        ]
        for (const corner of corners) {
          const ray = new RAPIER.Ray({ x: corner.x, y: bottomY, z: corner.z }, { x: 0, y: -1, z: 0 })
          const hit = this.world.castRay(ray, rayLen, true, undefined, undefined, entry.colliders[0])
          if (hit !== null && hit.timeOfImpact <= threshold) {
            return true
          }
        }
        const edgeMidpoints = [
          { x: pos.x, z: pos.z - hz },
          { x: pos.x, z: pos.z + hz },
          { x: pos.x - hx, z: pos.z },
          { x: pos.x + hx, z: pos.z },
        ]
        for (const edge of edgeMidpoints) {
          const ray = new RAPIER.Ray({ x: edge.x, y: bottomY, z: edge.z }, { x: 0, y: -1, z: 0 })
          const hit = this.world.castRay(ray, rayLen, true, undefined, undefined, entry.colliders[0])
          if (hit !== null && hit.timeOfImpact <= threshold) {
            return true
          }
        }
      }
    }
    return false
  }
  isColliding(idA: string, idB: string): boolean {
    const entriesA = [...this.entries.entries()].filter(([k]) => k.startsWith(idA + '_') || k === idA)
    const entriesB = [...this.entries.entries()].filter(([k]) => k.startsWith(idB + '_') || k === idB)
    if (!entriesA.length || !entriesB.length || !this.world) return false
    for (const [, ea] of entriesA) {
      for (const [, eb] of entriesB) {
        for (const ca of ea.colliders) {
          for (const cb of eb.colliders) {
            let found = false
            this.world.contactPair(ca, cb, () => { found = true })
            if (found) return true
          }
        }
      }
    }
    return false
  }
  addZone(zone: Zone): void {
    this.zones.set(zone.id, { zone, inside: new Set() })
    if (this.config.debug) this.createZoneDebugMesh(zone)
  }
  removeZone(zoneId: string): void {
    if (!this.zones.has(zoneId)) return
    this.zones.delete(zoneId)
    this.removeDebugMesh(`zone_${zoneId}`)
  }
  isInZone(id: string, zoneId: string): boolean {
    return this.zones.get(zoneId)?.inside.has(id) ?? false
  }
  getZonesForObject(id: string): Zone[] {
    return Array.from(this.zones.values()).filter(e => e.inside.has(id)).map(e => e.zone)
  }
  getObjectsInZone(zoneId: string): string[] {
    return Array.from(this.zones.get(zoneId)?.inside ?? [])
  }
  getMass(id: string): number {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        return entry.body.mass()
      }
    }
    return 1
  }
  setGravityScale(id: string, scale: number): void {
    for (const [pieceId, entry] of this.entries) {
      if (pieceId.startsWith(id + '_') || pieceId === id) {
        entry.body.setGravityScale(scale, true)
      }
    }
  }
  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    for (const mesh of this.debugMeshes.values()) {
      this.scene.remove(mesh)
      disposeMesh(mesh)
    }
    this.debugMeshes.clear()
    for (const [, entry] of this.entries) {
      for (const col of entry.colliders) {
        this.world?.removeCollider(col, false)
      }
      this.world?.removeRigidBody(entry.body)
    }
    this.entries.clear()
    this.zones.clear()
    this.world?.free()
    this.world = null
  }
  private computeBottomOffset(shape: HitboxShape | undefined): number {
    if (!shape) return 0.5
    if (shape.kind === 'sphere') return shape.radius ?? 0.5
    if (shape.kind === 'capsule') return (shape.height ?? 0.8) / 2 + (shape.radius ?? 0.4)
    if (shape.kind === 'box') return (shape.halfExtents ?? { y: 0.5 }).y
    return 0.5
  }
  private computeHalfExtents(shape: HitboxShape | undefined): { x: number; y: number; z: number } {
    if (!shape) return { x: 0.5, y: 0.5, z: 0.5 }
    if (shape.kind === 'sphere') {
      const r = shape.radius ?? 0.5
      return { x: r, y: r, z: r }
    }
    if (shape.kind === 'capsule') {
      const r = shape.radius ?? 0.4
      const h = (shape.height ?? 0.8) / 2
      return { x: r, y: h + r, z: r }
    }
    if (shape.kind === 'box') return shape.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 }
    return { x: 0.5, y: 0.5, z: 0.5 }
  }
  private buildColliderDesc(shape: HitboxShape): RAPIER.ColliderDesc {
    if (shape.kind === 'sphere') {
      return RAPIER.ColliderDesc.ball(shape.radius ?? 0.5)
    }
    if (shape.kind === 'capsule') {
      const r = shape.radius ?? 0.4
      const h = shape.height ?? 0.8
      return RAPIER.ColliderDesc.capsule(h / 2, r)
    }
    if (shape.kind === 'box') {
      const he = shape.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 }
      return RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z)
    }
    return RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
  }
  private autoHalfExtents(asset: THREE.Object3D): { x: number; y: number; z: number } {
    const box = new THREE.Box3().setFromObject(asset)
    const size = box.getSize(new THREE.Vector3())
    return { x: size.x / 2, y: size.y / 2, z: size.z / 2 }
  }
  private updateZones(allObjects: ManagedObject[]): void {
    for (const { zone, inside } of this.zones.values()) {
      for (const obj of allObjects) {
        const wasInside = inside.has(obj.id)
        const isNow = testZonePoint(obj.position, zone)
        if (!wasInside && isNow) { inside.add(obj.id); zone.onEnter?.(obj) }
        else if (wasInside && !isNow) { inside.delete(obj.id); zone.onExit?.(obj) }
      }
    }
  }
  private syncDebugMeshes(pieceId: string, pos: Vec3, rot: { x: number; y: number; z: number; w: number }): void {
    const entry = this.entries.get(pieceId)
    if (!entry) return
    const offset = entry.relativeOffset
    let i = 0
    while (this.debugMeshes.has(`${pieceId}_${i}`)) {
      const mesh = this.debugMeshes.get(`${pieceId}_${i}`)!
      mesh.position.set(pos.x + offset.x, pos.y + offset.y, pos.z + offset.z)
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w)
      i++
    }
  }
  private createDebugMeshes(pieceId: string, hitboxes: PieceHitbox[], _descriptor: PhysicsDescriptor): void {
    hitboxes.forEach((hb, i) => {
      this.createDebugMesh(`${pieceId}_${i}`, hb.shape, hb.relativeOffset)
    })
  }
  private createDebugMesh(
    key: string,
    shape: HitboxShape,
    offset?: Vec3,
  ): void {
    let mesh: THREE.Object3D
    if (shape.kind === 'sphere') {
      mesh = wireframeMesh(new THREE.SphereGeometry(shape.radius ?? 0.5, 8, 6), 0x00ff00)
    } else if (shape.kind === 'capsule') {
      const geo = new THREE.CylinderGeometry(shape.radius ?? 0.4, shape.radius ?? 0.4, shape.height ?? 0.8, 10)
      mesh = wireframeLines(geo, 0x0088ff)
    } else if (shape.kind === 'box') {
      const he = shape.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 }
      mesh = wireframeLines(new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2), 0xff6600)
    } else {
      mesh = wireframeLines(new THREE.BoxGeometry(1, 1, 1), 0xff6600)
    }
    if (offset) {
      mesh.position.set(offset.x, offset.y, offset.z)
    }
    this.scene.add(mesh)
    this.debugMeshes.set(key, mesh)
  }
  private createZoneDebugMesh(zone: Zone): void {
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.35 })
    let mesh: THREE.Mesh
    if (zone.shape.kind === 'sphere') {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(zone.shape.radius, 16, 12), mat)
    } else if (zone.shape.kind === 'box') {
      const he = zone.shape.halfExtents
      mesh = new THREE.Mesh(new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2), mat)
    } else {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(zone.shape.radius, zone.shape.radius, zone.shape.height, 20), mat)
    }
    mesh.position.set(zone.center.x, zone.center.y, zone.center.z)
    this.scene.add(mesh)
    this.debugMeshes.set(`zone_${zone.id}`, mesh)
  }
  private removeDebugMeshesForId(pieceId: string): void {
    let i = 0
    while (this.debugMeshes.has(`${pieceId}_${i}`)) {
      this.removeDebugMesh(`${pieceId}_${i}`)
      i++
    }
  }
  private removeDebugMesh(key: string): void {
    const mesh = this.debugMeshes.get(key)
    if (!mesh) return
    this.scene.remove(mesh)
    disposeMesh(mesh)
    this.debugMeshes.delete(key)
  }
}
export function makeZoneSphere(center: Vec3, radius: number): ZoneShape {
  return { kind: 'sphere', radius }
}
export function makeZoneBox(center: Vec3, halfExtents: Vec3): ZoneShape {
  return { kind: 'box', halfExtents }
}
export function makeZoneCylinder(center: Vec3, radius: number, height: number): ZoneShape {
  return { kind: 'cylinder', radius, height }
}
function testZonePoint(pos: Vec3, zone: Zone): boolean {
  const c = zone.center
  const s = zone.shape
  if (s.kind === 'sphere') {
    const dx = pos.x - c.x, dy = pos.y - c.y, dz = pos.z - c.z
    return dx * dx + dy * dy + dz * dz <= s.radius * s.radius
  }
  if (s.kind === 'box') {
    return Math.abs(pos.x - c.x) <= s.halfExtents.x
      && Math.abs(pos.y - c.y) <= s.halfExtents.y
      && Math.abs(pos.z - c.z) <= s.halfExtents.z
  }
  const dx = pos.x - c.x, dz = pos.z - c.z
  return dx * dx + dz * dz <= s.radius * s.radius && Math.abs(pos.y - c.y) <= s.height / 2
}
function wireframeMesh(geo: THREE.BufferGeometry, color: number): THREE.Mesh {
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, wireframe: true }))
}
function wireframeLines(geo: THREE.BufferGeometry, color: number): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(geo)
  geo.dispose()
  return new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }))
}
function disposeMesh(obj: THREE.Object3D): void {
  if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
    obj.geometry.dispose();
    (obj.material as THREE.Material).dispose()
  }
}
