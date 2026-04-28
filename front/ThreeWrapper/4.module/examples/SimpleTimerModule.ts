import type { Module, WorldContext } from '../ModuleClass'
export class SimpleTimerModule implements Module {
  readonly type = 'simple-timer'
  private elapsed = 0
  init(_ctx: WorldContext): void {}
  update(delta: number): void {
    this.elapsed += delta
    if (this.elapsed >= 1) {
      console.log(`Elapsed: ${this.elapsed.toFixed(2)}s`)
      this.elapsed = 0
    }
  }
  dispose(): void {}
}
