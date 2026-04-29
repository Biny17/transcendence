import { Logger } from '@/ThreeWrapper/1.engine/tools'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export class ResizeModule implements Module {
  readonly type = 'resize'
  private ctx: WorldContext | null = null
  private bound!: () => void
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.bound = () => this.onResize()
    window.addEventListener('resize', this.bound)
    this.onResize()
    const log = ctx.logger.for(this.type)
    const parent = ctx.renderer.domElement.parentElement
    const w = parent?.clientWidth || window.innerWidth
    const h = parent?.clientHeight || window.innerHeight
    log.logVariable('canvasSize', { w, h })
    log.logVariable('pixelRatio', window.devicePixelRatio)
  }
  private onResize(): void {
    if (!this.ctx) return
    const { camera, renderer } = this.ctx
    const parent = renderer.domElement.parentElement
    const w = parent?.clientWidth || window.innerWidth
    const h = parent?.clientHeight || window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  resize(): void {
    this.onResize()
  }
  update(_delta: number): void {
    const logger = Logger.getInstance()
    if (logger.isDebugFeatureEnabled('logRenderState') && logger.shouldLogThisFrame()) {
      const log = logger.for(this.type)
      if (this.ctx) {
        const info = this.ctx.renderer.info
        log.logVariable('drawCalls', info.render.calls)
        log.logVariable('triangles', info.render.triangles)
        log.logVariable('geometries', info.memory.geometries)
        log.logVariable('textures', info.memory.textures)
      }
    }
  }
  dispose(): void {
    window.removeEventListener('resize', this.bound)
    this.ctx = null
  }
}
