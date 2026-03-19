import type { EngineContext } from '../5.modules/Module'
import type { Extension } from './Extension'
export class MyExtension implements Extension {
  readonly type = 'my_extension'
  private context!: EngineContext
  init(context: EngineContext): void {
    this.context = context
  }
  update(_delta: number): void {
  }
  dispose(): void {
  }
}
