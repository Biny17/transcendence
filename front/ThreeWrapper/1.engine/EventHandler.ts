import type { GameConfigAction } from '@/shared/types'
type EventListener<T = unknown> = (data: T) => void
export class EventHandler {
  private readonly listeners = new Map<string, EventListener[]>()
  private readonly actionHandlers = new Map<string, (action: GameConfigAction, data: unknown) => void>()
  on<T = unknown>(event: string, listener: EventListener<T>): () => void {
    const list = this.listeners.get(event) ?? []
    list.push(listener as EventListener)
    this.listeners.set(event, list)
    return () => this.off(event, listener as EventListener)
  }
  off(event: string, listener: EventListener): void {
    const list = this.listeners.get(event)
    if (!list) return
    this.listeners.set(event, list.filter((l) => l !== listener))
  }
  emit<T = unknown>(event: string, data?: T): void {
    const list = this.listeners.get(event) ?? []
    for (const listener of list) listener(data)
  }
  onAction(
    actionType: string,
    handler: (action: GameConfigAction, data: unknown) => void,
  ): () => void {
    this.actionHandlers.set(actionType, handler)
    return () => this.actionHandlers.delete(actionType)
  }
  dispatchAction(action: GameConfigAction, data: unknown): void {
    const handler = this.actionHandlers.get(action.type)
    if (handler) {
      handler(action, data)
    } else {
      console.warn(`[EventHandler] No handler registered for action type: "${action.type}"`)
    }
  }
  dispose(): void {
    this.listeners.clear()
    this.actionHandlers.clear()
  }
}
