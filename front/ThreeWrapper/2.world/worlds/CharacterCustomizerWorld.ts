import * as THREE from 'three'
import { World } from '../WorldClass'
import { CharacterCustomizerEnvironment } from '@/ThreeWrapper/3.environment/envs/CharacterCustomizerEnvironment'
import { LightFactory, OBJECT_TYPE } from '../tools'
export class CharacterCustomizerWorld extends World {
  constructor() {
    super({ id: 'CharacterCustomizer' })
  }
  protected setupEnvironment(): void {
    this.applyEnvironment(new CharacterCustomizerEnvironment())
  }
  protected override async onLoad(): Promise<void> {
    this.ctx.scene.background = new THREE.Color(0x12121e)
    const ambient = LightFactory.createAmbientLight({ color: 0xffffff, intensity: 0.7 })
    this.ctx.objects.add({ type: OBJECT_TYPE.MAP, name: 'cc_ambient', pieces: [{ asset: ambient, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
    const key = LightFactory.createDirectionalLight({
      color: 0xffffff,
      intensity: 1.2,
      position: { x: 5, y: 8, z: 6 },
      castShadow: false
    })
    this.ctx.objects.add({ type: OBJECT_TYPE.MAP, name: 'cc_key', pieces: [{ asset: key, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
    const fill = LightFactory.createDirectionalLight({
      color: 0x8899cc,
      intensity: 0.4,
      position: { x: -4, y: 3, z: -5 },
      castShadow: false
    })
    this.ctx.objects.add({ type: OBJECT_TYPE.MAP, name: 'cc_fill', pieces: [{ asset: fill, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
    this.ctx.objects.addRaw(new THREE.GridHelper(10, 10, 0x333355, 0x1a1a2e))
  }
}
