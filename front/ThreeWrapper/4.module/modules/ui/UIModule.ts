import { createRoot, type Root } from 'react-dom/client'
import type { ReactNode } from 'react'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
type UIPanel = {
  node: ReactNode
  root: Root
  container: HTMLDivElement
}
declare global {
  interface Window {
    __uiModule?: UIModule
  }
}
export class UIModule implements Module {
  readonly type = 'ui'
  private overlay: HTMLDivElement | null = null
  private panels = new Map<string, UIPanel>()
  private _initialized = false
  get initialized(): boolean {
    return this._initialized
  }
  init(ctx: WorldContext): void {
    if (this._initialized) {
      if (this.overlay && ctx.canvas.parentElement && !ctx.canvas.parentElement.contains(this.overlay)) {
        const canvasParent = ctx.canvas.parentElement
        if (!canvasParent) return
        canvasParent.style.position = 'relative'
        canvasParent.appendChild(this.overlay)
      }
      return
    }
    this._initialized = true
    this.overlay = document.createElement('div')
    this.overlay.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      'z-index:10',
      'overflow:visible',
    ].join(';')
    const canvasParent = ctx.canvas.parentElement
    if (!canvasParent) throw new Error('[UIModule] canvas has no parent element')
    canvasParent.style.position = 'relative'
    canvasParent.appendChild(this.overlay)
  }
  show(id: string, node: ReactNode): void {
    this.hide(id)
    const container = document.createElement('div')
    container.dataset.uiPanel = id
    document.body.appendChild(container)
    const root = createRoot(container)
    root.render(node)
    this.panels.set(id, { node, root, container })
  }
  hide(id: string): void {
    const panel = this.panels.get(id)
    if (!panel) return
    panel.root.unmount()
    panel.container.remove()
    this.panels.delete(id)
  }
  isVisible(id: string): boolean {
    return this.panels.has(id)
  }
  enablePointer(id: string): void {
    const panel = this.panels.get(id)
    if (panel) panel.container.style.pointerEvents = 'auto'
  }
  disablePointer(id: string): void {
    const panel = this.panels.get(id)
    if (panel) panel.container.style.pointerEvents = 'none'
  }
  dispose(): void {
    for (const id of [...this.panels.keys()]) {
      this.hide(id)
    }
  }
}