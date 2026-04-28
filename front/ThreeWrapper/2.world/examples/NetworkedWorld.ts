import * as THREE from 'three'
import { World } from '../WorldClass'
import { DefaultEnvironment } from '@/ThreeWrapper/3.environment/envs/DefaultEnvironment'
import { GeometryFactory, LightFactory } from '../tools'
export class NetworkedWorld extends World {
  constructor() {
    super({ id: 'networked' })
  }
  protected setupEnvironment(): void {
    this.applyEnvironment(new DefaultEnvironment())
  }
  protected override async onLoad(): Promise<void> {
    this.ctx.scene.background = new THREE.Color(0x1a2a4a)
    const light = LightFactory.createDirectionalLight({
      intensity: 1,
      position: { x: 10, y: 20, z: 10 },
    })
    this.ctx.objects.add({ type: 'map', pieces: [{ asset: light, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }], name: 'light' })
    const floor = GeometryFactory.box({ width: 20, depth: 20, height: 1 })
    this.ctx.objects.add({ type: 'map', pieces: [{ asset: floor, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }], name: 'floor' })
    this.ctx.camera.position.set(0, 5, 15)
  }
  protected override onStart(): void {}
  protected override onDispose(): void {}
}
