import * as THREE from 'three'
import { World } from '../WorldClass'
import { EditorEnvironment } from '@/ThreeWrapper/3.environment/envs/EditorEnvironment'
import { LightFactory } from '../tools'
import { OBJECT_TYPE } from '../tools'
export class EditorWorld extends World {
  constructor() {
    super({ id: 'Editor' })
  }
  protected setupEnvironment(): void {
    this.applyEnvironment(new EditorEnvironment())
  }
  protected override async onLoad(): Promise<void> {
    this.ctx.scene.background = new THREE.Color(0x18182a)
    const ambient = LightFactory.createAmbientLight({ color: 0xffffff, intensity: 0.5 })
    this.ctx.objects.add({ type: OBJECT_TYPE.MAP, name: 'editor_ambient', pieces: [{ asset: ambient, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
    const sun = LightFactory.createDirectionalLight({
      color: 0xffffff,
      intensity: 0.9,
      position: { x: 10, y: 20, z: 10 },
      castShadow: false,
    })
    this.ctx.objects.add({ type: OBJECT_TYPE.MAP, name: 'editor_sun', pieces: [{ asset: sun, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
    this.ctx.objects.addRaw(new THREE.GridHelper(1000, 1000, 0x444466, 0x222244))
  }
}
