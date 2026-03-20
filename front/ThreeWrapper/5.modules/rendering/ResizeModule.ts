import { Logger } from '@/ThreeWrapper/1.engine/Logger'
import type { Module, EngineContext } from '@/ThreeWrapper/5.modules/Module'
export class ResizeModule implements Module {
  readonly type = 'resize'
  private context: EngineContext | null = null
  private bound!: () => void
  init(context: EngineContext): void {
    this.context = context
    this.bound = () => this.onResize()
    window.addEventListener('resize', this.bound)
    this.onResize()
    const log = context.logger?.for(this.type)
    const parent = context.renderer.domElement.parentElement
    const w = parent?.clientWidth || window.innerWidth
    const h = parent?.clientHeight || window.innerHeight
    log?.logVariable('canvasSize', { w, h })
    log?.logVariable('pixelRatio', window.devicePixelRatio)
  }
  private onResize(): void {
    if (!this.context) return
    const { camera, renderer } = this.context
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
      if (this.context) {
        const info = this.context.renderer.info
        log.logVariable('drawCalls', info.render.calls)
        log.logVariable('triangles', info.render.triangles)
        log.logVariable('geometries', info.memory.geometries)
        log.logVariable('textures', info.memory.textures)
      }
    }
  }
  dispose(): void {
    window.removeEventListener('resize', this.bound)
    this.context = null
  }
}
