import { createRoot, type Root } from 'react-dom/client'
import type { ReactNode } from 'react'
import type { Module, EngineContext } from '@/ThreeWrapper/5.modules/Module'
type UIPanel = {
  node: ReactNode
  root: Root
  container: HTMLDivElement
}
export class UIModule implements Module {
  readonly type = 'ui'
  private overlay: HTMLDivElement | null = null
  private panels = new Map<string, UIPanel>()
  init(context: EngineContext): void {
    this.overlay = document.createElement('div')
    this.overlay.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      'z-index:10',
    ].join(';')
    const canvasParent = context.canvas.parentElement
    if (!canvasParent) throw new Error('[UIModule] canvas has no parent element')
    canvasParent.style.position = 'relative'
    canvasParent.appendChild(this.overlay)
  }
  show(id: string, node: ReactNode): void {
    if (!this.overlay) return
    this.hide(id) 
    const container = document.createElement('div')
    container.dataset.uiPanel = id
    this.overlay.appendChild(container)
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
    for (const id of [...this.panels.keys()]) this.hide(id)
    this.overlay?.remove()
    this.overlay = null
  }
}
