import type { EngineContext } from '../5.modules/Module'
export interface Extension {
  readonly type: string
  init(context: EngineContext): void | Promise<void>
  update?(delta: number): void
  dispose(): void
}
