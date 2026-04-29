import * as THREE from 'three'
import { World } from '../WorldClass'
import { MinimalEnvironment } from '@/ThreeWrapper/3.environment/envs/MinimalEnvironment'
export class MinimalWorld extends World {
  constructor() {
    super({ id: 'minimal' })
  }
  protected setupEnvironment(): void {
    this.applyEnvironment(new MinimalEnvironment())
  }
  protected override async onLoad(): Promise<void> {
    this.ctx.scene.background = new THREE.Color(0x1a1a1a)
    this.ctx.camera.position.set(0, 5, 10)
  }
  protected override onStart(): void {}
  protected override onDispose(): void {}
}
