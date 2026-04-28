import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { ModuleKey } from '@/ThreeWrapper/4.module'
export class EditorOrbitCameraModule implements Module {
  readonly type = ModuleKey.editorOrbitCamera
  private controls: OrbitControls | null = null
  init(ctx: WorldContext): void {
    this.controls = new OrbitControls(ctx.camera, ctx.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.screenSpacePanning = true
    ctx.camera.position.set(12, 10, 12)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }
  update(_delta: number): void {
    this.controls?.update()
  }
  setEnabled(enabled: boolean): void {
    if (this.controls) this.controls.enabled = enabled
  }
  dispose(): void {
    this.controls?.dispose()
    this.controls = null
  }
}
