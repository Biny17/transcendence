import * as THREE from 'three'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type PhysicsDebugModuleOptions = {
  enabled?: boolean
  toggleKey?: string
}
export class PhysicsDebugModule implements Module {
  readonly type = 'physics_debug'
  private ctx: WorldContext | null = null
  private enabled: boolean
  private toggleKey: string
  private debugGroup: THREE.Group | null = null
  private _onKeyDown: ((e: KeyboardEvent) => void) | null = null
  constructor(options: PhysicsDebugModuleOptions = {}) {
    this.enabled = options.enabled ?? false
    this.toggleKey = options.toggleKey ?? 'F3'
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.debugGroup = new THREE.Group()
    this.debugGroup.name = 'physics-debug'
    this.debugGroup.visible = this.enabled
    ctx.objects.addRaw(this.debugGroup)
    this._onKeyDown = (e: KeyboardEvent) => {
      if (e.code === this.toggleKey || e.key === this.toggleKey) {
        this.toggle()
      }
    }
    window.addEventListener('keydown', this._onKeyDown)
  }
  toggle(): void {
    this.enabled = !this.enabled
    if (this.debugGroup) this.debugGroup.visible = this.enabled
  }
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (this.debugGroup) this.debugGroup.visible = enabled
  }
  isEnabled(): boolean {
    return this.enabled
  }
  update(_delta: number): void {
    if (!this.enabled || !this.ctx || !this.debugGroup) return
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children[0]
      this.debugGroup.remove(child)
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    }
    const objects = this.ctx.objects.getAll()
    for (const obj of objects) {
      if (!obj.physics || obj.pieces.length === 0) continue
      const firstPiece = obj.pieces[0]
      if (!firstPiece || firstPiece.hitboxes.length === 0) continue
      const hitbox = firstPiece.hitboxes[0]
      const shape = hitbox.shape
      let geo: THREE.BufferGeometry
      if (shape.kind === 'sphere') {
        geo = new THREE.SphereGeometry(shape.radius ?? 0.5, 8, 6)
      } else if (shape.kind === 'capsule') {
        geo = new THREE.CapsuleGeometry(shape.radius ?? 0.4, shape.height ?? 0.8, 4, 8)
      } else if (shape.kind === 'auto') {
        const box = new THREE.Box3().setFromObject(firstPiece.asset)
        const size = box.getSize(new THREE.Vector3())
        geo = new THREE.BoxGeometry(size.x, size.y, size.z)
      } else {
        const he = shape.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 }
        geo = new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2)
      }
      const edges = new THREE.EdgesGeometry(geo)
      geo.dispose()
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x00ff00 }),
      )
      line.position.copy(firstPiece.asset.position)
      line.quaternion.copy(firstPiece.asset.quaternion)
      this.debugGroup.add(line)
    }
  }
  dispose(): void {
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown)
    }
    if (this.debugGroup && this.ctx) {
      this.ctx.objects.removeRaw(this.debugGroup)
      while (this.debugGroup.children.length > 0) {
        const child = this.debugGroup.children[0]
        this.debugGroup.remove(child)
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      }
    }
    this.debugGroup = null
    this._onKeyDown = null
    this.ctx = null
  }
}
