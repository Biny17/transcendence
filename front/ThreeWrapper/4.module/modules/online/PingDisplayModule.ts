import { SERVER_MSG } from 'shared/protocol'
import type { WorldStatePayload } from 'shared/protocol'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type PingDisplayModuleOptions = {
  onPingUpdate?: (ping: number) => void
}
export class PingDisplayModule implements Module {
  readonly type = 'ping_display'
  private ctx: WorldContext | null = null
  private onPingUpdate: ((ping: number) => void) | null
  private lastPing = 0
  private pingHistory: number[] = []
  private maxHistory = 20
  private unsubscribe: (() => void) | null = null
  constructor(options: PingDisplayModuleOptions = {}) {
    this.onPingUpdate = options.onPingUpdate ?? null
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    this.unsubscribe = ctx.server?.on(
      SERVER_MSG.WORLD_STATE,
      (_payload: WorldStatePayload, _raw?: { ts?: number }) => {
        if (_raw?.ts) {
          const oneWay = Date.now() - _raw.ts
          this.lastPing = Math.max(0, oneWay * 2)
          this.pingHistory.push(this.lastPing)
          if (this.pingHistory.length > this.maxHistory) this.pingHistory.shift()
          this.onPingUpdate?.(this.lastPing)
        }
      },
    ) ?? null
  }
  update(_delta: number): void {}
  getPing(): number {
    return this.lastPing
  }
  getAveragePing(): number {
    if (this.pingHistory.length === 0) return 0
    return Math.round(
      this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length,
    )
  }
  getJitter(): number {
    if (this.pingHistory.length < 2) return 0
    const avg = this.getAveragePing()
    const variance = this.pingHistory.reduce((sum, p) => sum + (p - avg) ** 2, 0) / this.pingHistory.length
    return Math.round(Math.sqrt(variance))
  }
  dispose(): void {
    this.unsubscribe?.()
    this.pingHistory = []
    this.onPingUpdate = null
    this.ctx = null
  }
}
