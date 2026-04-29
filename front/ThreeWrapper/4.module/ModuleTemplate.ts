import type { Module, WorldContext } from './ModuleClass'
type MyModuleOptions = {
  enabled?: boolean
  exampleOption?: string
}
export class MyModule implements Module {
  readonly type = 'my-module'
  private ctx: WorldContext | null = null
  private options: Required<MyModuleOptions>
  constructor(options: MyModuleOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      exampleOption: options.exampleOption ?? 'default',
    }
  }
  init(ctx: WorldContext): void | Promise<void> {
    this.ctx = ctx
  }
  update(delta: number): void {
    if (!this.options.enabled || !this.ctx) return
  }
  dispose(): void {
    this.ctx = null
  }
}
