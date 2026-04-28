import type { Module, WorldContext } from '../ModuleClass'
type AssetConfig = {
  assets: string[]
}
export class AssetPreloaderModule implements Module {
  readonly type = 'asset-preloader'
  private ctx: WorldContext | null = null
  private assetPaths: string[]
  constructor(config: AssetConfig) {
    this.assetPaths = config.assets
  }
  async init(ctx: WorldContext): Promise<void> {
    this.ctx = ctx
    for (const path of this.assetPaths) {
      try {
        await ctx.gltf.load(path, path)
      } catch (e) {
        console.error(`Failed to preload asset: ${path}`, e)
      }
    }
  }
  update(_delta: number): void {}
  dispose(): void {
    this.ctx = null
  }
}
