import * as THREE from 'three'
import type { Module, EngineContext } from '../Module'
import type { ManagedObject } from '@/ThreeWrapper/2.world/tools/ObjectManager'
export type ZoneSphere = {
  shape: 'sphere'
  center: THREE.Vector3
  radius: number
}
export type ZoneBox = {
  shape: 'box'
  center: THREE.Vector3
  halfExtents: THREE.Vector3
}
export type ZoneCylinder = {
  shape: 'cylinder'
  center: THREE.Vector3
  radius: number
  height: number
}
export type ZoneShape = ZoneSphere | ZoneBox | ZoneCylinder
export type Zone = {
  id: string
  shape: ZoneShape
  onEnter?: (obj: ManagedObject) => void
  onExit?: (obj: ManagedObject) => void
}
export type ZoneModuleOptions = {
  debug?: boolean
}
export class ZoneModule implements Module {
  readonly type = 'zone-module'
  private context: EngineContext | null = null
  private zones: Map<string, Zone> = new Map()
  private insideMap: Map<string, Set<string>> = new Map()
  private debugMeshes: Map<string, THREE.Object3D> = new Map()
  private debug: boolean
  constructor(options: ZoneModuleOptions = {}) {
    this.debug = options.debug ?? false
  }
  init(context: EngineContext): void {
    this.context = context
  }
  addZone(zone: Zone): void {
    this.zones.set(zone.id, zone)
    this.insideMap.set(zone.id, new Set())
    if (this.debug && this.context) {
      this.createDebugMesh(zone)
    }
  }
  removeZone(zoneId: string): void {
    this.zones.delete(zoneId)
    this.insideMap.delete(zoneId)
    if (this.context) {
      const mesh = this.debugMeshes.get(zoneId)
      if (mesh) {
        this.context.scene.remove(mesh)
        disposeMesh(mesh)
        this.debugMeshes.delete(zoneId)
      }
    }
  }
  getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId)
  }
  getAllZones(): Zone[] {
    return Array.from(this.zones.values())
  }
  isInZone(obj: ManagedObject, zoneId: string): boolean {
    const zone = this.zones.get(zoneId)
    if (!zone || !obj.object3d) return false
    const pos = new THREE.Vector3()
    obj.object3d.getWorldPosition(pos)
    return testPoint(pos, zone.shape)
  }
  getZonesForObject(obj: ManagedObject): Zone[] {
    const result: Zone[] = []
    if (!obj.object3d) return result
    const pos = new THREE.Vector3()
    obj.object3d.getWorldPosition(pos)
    for (const zone of this.zones.values()) {
      if (testPoint(pos, zone.shape)) result.push(zone)
    }
    return result
  }
  getObjectsInZone(zoneId: string): string[] {
    return Array.from(this.insideMap.get(zoneId) ?? [])
  }
  update(_delta: number): void {
    if (!this.context) return
    const tracked: ManagedObject[] = []
    const allObjects = this.context.world.objects.getAll()
    for (const obj of allObjects) {
      if (obj.object3d && (obj.extraData.trackZone as boolean)) {
        tracked.push(obj)
      }
    }
    const pos = new THREE.Vector3()
    for (const zone of this.zones.values()) {
      const inside = this.insideMap.get(zone.id)!
      for (const obj of tracked) {
        if (!obj.object3d) continue
        obj.object3d.getWorldPosition(pos)
        const wasInside = inside.has(obj.id)
        const isNowInside = testPoint(pos, zone.shape)
        if (!wasInside && isNowInside) {
          inside.add(obj.id)
          zone.onEnter?.(obj)
        } else if (wasInside && !isNowInside) {
          inside.delete(obj.id)
          zone.onExit?.(obj)
        }
      }
      const trackedIds = new Set(tracked.map(o => o.id))
      for (const id of inside) {
        if (!trackedIds.has(id)) inside.delete(id)
      }
    }
  }
  private createDebugMesh(zone: Zone): void {
    if (!this.context) return
    let mesh: THREE.Object3D
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.4 })
    if (zone.shape.shape === 'sphere') {
      const geo = new THREE.SphereGeometry(zone.shape.radius, 16, 12)
      mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(zone.shape.center)
    } else if (zone.shape.shape === 'box') {
      const he = zone.shape.halfExtents
      const geo = new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2)
      mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(zone.shape.center)
    } else {
      const geo = new THREE.CylinderGeometry(zone.shape.radius, zone.shape.radius, zone.shape.height, 20)
      mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(zone.shape.center)
    }
    this.context.scene.add(mesh)
    this.debugMeshes.set(zone.id, mesh)
  }
  dispose(): void {
    if (this.context) {
      for (const mesh of this.debugMeshes.values()) {
        this.context.scene.remove(mesh)
        disposeMesh(mesh)
      }
    }
    this.debugMeshes.clear()
    this.zones.clear()
    this.insideMap.clear()
    this.context = null
  }
}
function testPoint(point: THREE.Vector3, shape: ZoneShape): boolean {
  if (shape.shape === 'sphere') {
    return point.distanceTo(shape.center) <= shape.radius
  }
  if (shape.shape === 'box') {
    const d = new THREE.Vector3().subVectors(point, shape.center)
    return (
      Math.abs(d.x) <= shape.halfExtents.x &&
      Math.abs(d.y) <= shape.halfExtents.y &&
      Math.abs(d.z) <= shape.halfExtents.z
    )
  }
  const dx = point.x - shape.center.x
  const dz = point.z - shape.center.z
  const halfH = shape.height / 2
  return (
    dx * dx + dz * dz <= shape.radius * shape.radius &&
    Math.abs(point.y - shape.center.y) <= halfH
  )
}
function disposeMesh(obj: THREE.Object3D): void {
  if (obj instanceof THREE.Mesh) {
    obj.geometry.dispose();
    (obj.material as THREE.Material).dispose()
  }
}
export function makeZoneSphere(center: THREE.Vector3, radius: number): ZoneSphere {
  return { shape: 'sphere', center, radius }
}
export function makeZoneBox(center: THREE.Vector3, halfExtents: THREE.Vector3): ZoneBox {
  return { shape: 'box', center, halfExtents }
}
export function makeZoneCylinder(center: THREE.Vector3, radius: number, height: number): ZoneCylinder {
  return { shape: 'cylinder', center, radius, height }
}
