import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { ModuleKey } from '@/ThreeWrapper/4.module'
export class CharacterOrbitCameraModule implements Module {
  readonly type = ModuleKey.characterOrbitCamera
  private controls: OrbitControls | null = null
  init(ctx: WorldContext): void {
    this.controls = new OrbitControls(ctx.camera, ctx.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.screenSpacePanning = true
    ctx.camera.position.set(0, 1.2, 4)
    this.controls.target.set(0, 1, 0)
    this.controls.update()
  }
  setEnabled(val: boolean): void {
    if (this.controls) this.controls.enabled = val
  }
  update(_delta: number): void {
    this.controls?.update()
  }
  dispose(): void {
    this.controls?.dispose()
    this.controls = null
  }
}
