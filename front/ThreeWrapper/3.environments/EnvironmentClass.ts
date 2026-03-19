import type { EnvConfig } from '../../shared/types'
import type { Extension } from '../4.extensions/Extension'
import type { Module } from '../5.modules/Module'
export class Environment {
  readonly config: EnvConfig
  protected modules: Module[] = []
  protected extensions: Extension[] = []
  constructor(config: EnvConfig) {
    this.config = config
  }
  protected addModule(module: Module): void {
    this.modules.push(module)
  }
  protected addExtension(extension: Extension): void {
    this.extensions.push(extension)
  }
  getModules(): Module[] {
    return this.modules
  }
  getExtensions(): Extension[] {
    return this.extensions
  }
}
