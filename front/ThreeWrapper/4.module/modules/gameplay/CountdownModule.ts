import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
export type CountdownModuleOptions = {
  duration: number
  autoStart?: boolean
  onTick?: (remaining: number) => void
  onExpire?: () => void
}
export class CountdownModule implements Module {
  readonly type = 'countdown'
  private ctx: WorldContext | null = null
  private duration: number
  private remaining: number
  private running = false
  private autoStart: boolean
  private onTick: ((remaining: number) => void) | null
  private onExpire: (() => void) | null
  constructor(options: CountdownModuleOptions) {
    this.duration = options.duration
    this.remaining = options.duration
    this.autoStart = options.autoStart ?? false
    this.onTick = options.onTick ?? null
    this.onExpire = options.onExpire ?? null
  }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    if (this.autoStart) this.start()
  }
  start(): void {
    this.running = true
  }
  pause(): void {
    this.running = false
  }
  reset(duration?: number): void {
    this.remaining = duration ?? this.duration
    this.running = false
  }
  restart(duration?: number): void {
    this.reset(duration)
    this.start()
  }
  getRemaining(): number {
    return this.remaining
  }
  isRunning(): boolean {
    return this.running
  }
  isExpired(): boolean {
    return this.remaining <= 0
  }
  update(delta: number): void {
    if (!this.running || this.remaining <= 0) return
    const prev = Math.ceil(this.remaining)
    this.remaining -= delta
    const curr = Math.ceil(this.remaining)
    if (curr !== prev && curr > 0) {
      this.onTick?.(curr)
    }
    if (this.remaining <= 0) {
      this.remaining = 0
      this.running = false
      this.onExpire?.()
    }
  }
  dispose(): void {
    this.running = false
    this.onTick = null
    this.onExpire = null
    this.ctx = null
  }
}
