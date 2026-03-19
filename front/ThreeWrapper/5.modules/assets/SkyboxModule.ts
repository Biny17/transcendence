import * as THREE from 'three'
import type { Module, EngineContext } from '../Module'
export interface SkyboxModuleOptions {
  files: string[]
}
export class SkyboxModule implements Module {
  readonly type = 'skybox'
  private options: SkyboxModuleOptions
  private texture: THREE.CubeTexture | null = null
  private context: EngineContext | null = null
  constructor(options: SkyboxModuleOptions) {
    this.options = options
  }
  init(context: EngineContext): void {
    this.context = context
    const loader = new THREE.CubeTextureLoader()
    const urls = this.options.files.slice(0, 6) as [string, string, string, string, string, string]
    this.texture = loader.load(urls)
    context.scene.background = this.texture
  }
  update(_delta: number): void {}
  dispose(): void {
    if (this.context && this.context.scene.background === this.texture) {
      this.context.scene.background = null
    }
    this.texture?.dispose()
    this.texture = null
    this.context = null
  }
}
