import * as THREE from 'three'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type InspectorModuleOptions = {
  enabled?: boolean
  toggleKey?: string
}
export class InspectorModule implements Module {
  readonly type = 'inspector'
  private ctx: WorldContext | null = null
  private enabled: boolean
  private toggleKey: string
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  })
  private highlightMesh: THREE.Mesh | null = null
  private infoEl: HTMLDivElement | null = null
  private _onClick: ((e: MouseEvent) => void) | null = null
  private _onKeyDown: ((e: KeyboardEvent) => void) | null = null
  constructor(options: InspectorModuleOptions = {}) {
    this.enabled = options.enabled ?? false
    this.toggleKey = options.toggleKey ?? 'F4'
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.infoEl = document.createElement('div')
    this.infoEl.style.cssText =
      'position:fixed;bottom:8px;left:8px;z-index:99999;background:rgba(0,0,0,0.8);color:#fff;font-family:monospace;font-size:11px;padding:6px 10px;pointer-events:none;display:none;white-space:pre;border-radius:4px;'
    document.body.appendChild(this.infoEl)
    this._onClick = (e: MouseEvent) => {
      if (!this.enabled || !this.ctx) return
      const rect = this.ctx.canvas.getBoundingClientRect()
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      this.inspect()
    }
    this._onKeyDown = (e: KeyboardEvent) => {
      if (e.code === this.toggleKey || e.key === this.toggleKey) {
        this.toggle()
      }
    }
    this.ctx.canvas.addEventListener('click', this._onClick)
    window.addEventListener('keydown', this._onKeyDown)
  }
  toggle(): void {
    this.enabled = !this.enabled
    if (!this.enabled) this.clearHighlight()
  }
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.clearHighlight()
  }
  private inspect(): void {
    if (!this.ctx) return
    this.raycaster.setFromCamera(this.mouse, this.ctx.camera)
    const intersects = this.raycaster.intersectObjects(this.ctx.scene.children, true)
    if (intersects.length === 0) {
      this.clearHighlight()
      return
    }
    const hit = intersects[0]
    const obj = hit.object
    const managed = this.ctx.objects.getAll().find(
      m => {
        const firstPiece = m.pieces[0]?.asset;
        return firstPiece === obj || (firstPiece && obj.parent === firstPiece);
      },
    )
    const info = [
      `Name: ${obj.name || '(unnamed)'}`,
      `Type: ${obj.type}`,
      `Pos: ${fmt(obj.position)}`,
      `Rot: ${fmt(obj.rotation)}`,
      `Scale: ${fmt(obj.scale)}`,
    ]
    if (managed) {
      info.push(`Managed ID: ${managed.id}`)
      info.push(`Managed Type: ${managed.type}`)
      if (Object.keys(managed.extraData).length > 0) {
        info.push(`Extra: ${JSON.stringify(managed.extraData)}`)
      }
    }
    if (this.infoEl) {
      this.infoEl.textContent = info.join('\n')
      this.infoEl.style.display = 'block'
    }
    this.clearHighlight()
    if (obj instanceof THREE.Mesh) {
      this.highlightMesh = new THREE.Mesh(obj.geometry, this.highlightMaterial)
      this.highlightMesh.position.copy(obj.position)
      this.highlightMesh.rotation.copy(obj.rotation)
      this.highlightMesh.scale.copy(obj.scale)
      obj.parent?.add(this.highlightMesh)
    }
    console.log('[Inspector]', info.join(' | '), obj)
  }
  private clearHighlight(): void {
    if (this.highlightMesh) {
      this.highlightMesh.parent?.remove(this.highlightMesh)
      this.highlightMesh = null
    }
    if (this.infoEl) this.infoEl.style.display = 'none'
  }
  update(_delta: number): void {}
  dispose(): void {
    if (this._onClick && this.ctx) {
      this.ctx.canvas.removeEventListener('click', this._onClick)
    }
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown)
    }
    this.clearHighlight()
    this.highlightMaterial.dispose()
    this.infoEl?.remove()
    this.infoEl = null
    this._onClick = null
    this._onKeyDown = null
    this.ctx = null
  }
}
function fmt(v: { x: number; y: number; z: number }): string {
  return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`
}
