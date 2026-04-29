import * as THREE from 'three'
import { World } from '../WorldClass'
import { DefaultEnvironment } from '@/ThreeWrapper/3.environment/envs/DefaultEnvironment'
import { GeometryFactory, LightFactory } from '../tools'
export class InteractiveWorld extends World {
  constructor() {
    super({ id: 'interactive' })
  }
  protected setupEnvironment(): void {
    this.applyEnvironment(new DefaultEnvironment())
  }
  protected override async onLoad(): Promise<void> {
    this.ctx.scene.background = new THREE.Color(0x222222)
    const light = LightFactory.createDirectionalLight({
      intensity: 1.2,
      position: { x: 10, y: 20, z: 10 },
    })
    this.ctx.objects.add({ type: 'map', pieces: [{ asset: light, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }], name: 'light' })
    const floor = GeometryFactory.box({ width: 10, depth: 10, height: 0.5 })
    this.ctx.objects.add({ type: 'map', pieces: [{ asset: floor, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }], name: 'floor' })
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0xff6b6b })
    )
    cube.position.set(0, 3, 0)
    this.ctx.objects.add({ type: 'map', pieces: [{ asset: cube, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }], name: 'cube' })
    this.ctx.camera.position.set(0, 5, 8)
  }
  protected override onStart(): void {}
  protected override onDispose(): void {}
}
