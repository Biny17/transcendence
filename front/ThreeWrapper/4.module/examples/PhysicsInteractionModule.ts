import * as THREE from 'three'
import type { Module, WorldContext } from '../ModuleClass'
type PhysicsInteractionConfig = {
  impulseStrength?: number
}
export class PhysicsInteractionModule implements Module {
  readonly type = 'physics-interaction'
  private ctx: WorldContext | null = null
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private impulseStrength: number
  constructor(config: PhysicsInteractionConfig = {}) {
    this.impulseStrength = config.impulseStrength ?? 10
  }
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
      const hit = intersects[0].object
      const id = hit.userData?.id as string | undefined
      if (id) {
        const direction = intersects[0].point.clone().normalize()
        const impulse = direction.multiplyScalar(this.impulseStrength)
        this.ctx.objects.applyImpulse(id, impulse)
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
