import * as THREE from 'three'
import type { Module, WorldContext } from '../ModuleClass'
export class ObjectInteractionModule implements Module {
  readonly type = 'object-interaction'
  private ctx: WorldContext | null = null
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  init(ctx: WorldContext): void {
    this.ctx = ctx
    ctx.canvas.addEventListener('click', (e) => this.onCanvasClick(e))
  }
  private onCanvasClick(event: MouseEvent): void {
    if (!this.ctx) return
    const rect = this.ctx.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouse, this.ctx.camera)
    const intersects = this.raycaster.intersectObjects(this.ctx.scene.children, true)
    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh
      if (obj.material instanceof THREE.Material) {
        (obj.material as any).color?.setHex(Math.random() * 0xffffff)
      }
    }
  }
  update(_delta: number): void {}
  dispose(): void {
    if (this.ctx) {
      this.ctx.canvas.removeEventListener('click', (e) => this.onCanvasClick(e))
    }
    this.ctx = null
  }
}
