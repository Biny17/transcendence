import type { Module, EngineContext } from './Module'
type MyModuleOptions = {
  exampleOption?: string
}
export class MyModule implements Module {
  readonly type = 'my-module' 
  private context: EngineContext | null = null
  private options: Required<MyModuleOptions>
  constructor(options: MyModuleOptions = {}) {
    this.options = {
      exampleOption: options.exampleOption ?? 'default',
    }
  }
  init(context: EngineContext): void {
    this.context = context
  }
  update(_delta: number): void {
  }
  dispose(): void {
    this.context = null
  }
}
