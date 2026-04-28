import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type StatsModuleOptions = {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
export class StatsModule implements Module {
  readonly type = 'stats'
  private ctx: WorldContext | null = null
  private container: HTMLDivElement | null = null
  private fpsEl: HTMLSpanElement | null = null
  private frameCount = 0
  private elapsed = 0
  private currentFps = 0
  private position: StatsModuleOptions['position']
  constructor(options: StatsModuleOptions = {}) {
    this.position = options.position ?? 'top-left'
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.container = document.createElement('div')
    this.container.style.cssText = this.getPositionStyle()
    this.container.style.position = 'fixed'
    this.container.style.zIndex = '99999'
    this.container.style.background = 'rgba(0,0,0,0.7)'
    this.container.style.color = '#0f0'
    this.container.style.fontFamily = 'monospace'
    this.container.style.fontSize = '12px'
    this.container.style.padding = '4px 8px'
    this.container.style.pointerEvents = 'none'
    this.fpsEl = document.createElement('span')
    this.container.appendChild(this.fpsEl)
    document.body.appendChild(this.container)
  }
  private getPositionStyle(): string {
    switch (this.position) {
      case 'top-right': return 'top:0;right:0;'
      case 'bottom-left': return 'bottom:0;left:0;'
      case 'bottom-right': return 'bottom:0;right:0;'
      default: return 'top:0;left:0;'
    }
  }
  update(delta: number): void {
    this.frameCount++
    this.elapsed += delta
    if (this.elapsed >= 1) {
      this.currentFps = Math.round(this.frameCount / this.elapsed)
      this.frameCount = 0
      this.elapsed = 0
      if (this.fpsEl && this.ctx) {
        const info = this.ctx.renderer.info
        const statsData = {
          fps: this.currentFps,
          drawCalls: info.render.calls,
          triangles: info.render.triangles,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
        }
        this.fpsEl.textContent =
          `FPS: ${statsData.fps} | Draw: ${statsData.drawCalls} | Tri: ${statsData.triangles} | Geo: ${statsData.geometries} | Tex: ${statsData.textures}`
        if (window.__stats) Object.assign(window.__stats, statsData)
      }
    }
  }
  getFps(): number {
    return this.currentFps
  }
  dispose(): void {
    this.container?.remove()
    this.container = null
    this.fpsEl = null
    this.ctx = null
  }
}
